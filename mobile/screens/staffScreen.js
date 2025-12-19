import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, TextInput, Modal, 
  StyleSheet, Alert, ActivityIndicator 
} from 'react-native';
import { getStaff, addStaff, updateStaff, deleteStaff } from '../services/staffService';

export default function StaffScreen() {
  const [staff, setStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Form State
  const [form, setForm] = useState({ full_name: '', role: 'Nurse', username: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await getStaff();
    setStaff(data);
    setFilteredStaff(data);
    setLoading(false);
  };

  // --- SEARCH LOGIC (Matches your render(filter) function) ---
  const handleSearch = (text) => {
    setSearch(text);
    if (text) {
      const lower = text.toLowerCase();
      const filtered = staff.filter(s => 
        s.full_name.toLowerCase().includes(lower) || 
        s.username.toLowerCase().includes(lower) ||
        s.role.toLowerCase().includes(lower)
      );
      setFilteredStaff(filtered);
    } else {
      setFilteredStaff(staff);
    }
  };

  // --- SAVE LOGIC (Matches your saveModal event) ---
  const handleSave = async () => {
    if (!form.full_name || !form.username) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (isEditing) {
      // EDIT MODE
      const res = await updateStaff(editId, form);
      if (res.success) Alert.alert("Success", "Staff updated!");
      else Alert.alert("Error", "Update failed");
    } else {
      // ADD MODE
      const res = await addStaff(form);
      if (res.success) Alert.alert("Success", "Staff added!");
      else Alert.alert("Error", res.message || "Add failed");
    }

    setModalVisible(false);
    loadData();
  };

  // --- DELETE LOGIC (Matches your delBtn event) ---
  const handleDelete = (id) => {
    Alert.alert("Delete Staff", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await deleteStaff(id);
        loadData();
      }}
    ]);
  };

  // --- MODAL CONTROLS ---
  const openAdd = () => {
    setForm({ full_name: '', role: 'Doctor', username: '' });
    setIsEditing(false);
    setModalVisible(true);
  };

  const openEdit = (item) => {
    setForm({ full_name: item.full_name, role: item.role, username: item.username });
    setEditId(item.id);
    setIsEditing(true);
    setModalVisible(true);
  };

  // --- RENDER HELPERS (Matches your getBadgeClass) ---
  const getBadgeColor = (role) => {
    const r = role.toLowerCase();
    if (r.includes('admin')) return { bg: '#e3f2fd', text: '#0d47a1' }; // Blue
    if (r.includes('doctor')) return { bg: '#e8f5e9', text: '#1b5e20' }; // Green
    if (r.includes('nurse')) return { bg: '#fff3e0', text: '#e65100' }; // Orange
    return { bg: '#f5f5f5', text: '#616161' }; // Grey
  };

  const renderItem = ({ item }) => {
    const badge = getBadgeColor(item.role);
    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <Text style={styles.name}>{item.full_name}</Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={{ color: badge.text, fontSize: 12, fontWeight:'bold' }}>{item.role}</Text>
          </View>
          <Text style={styles.user}>@{item.username}</Text>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}>
            <Text style={{fontSize:20}}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
            <Text style={{fontSize:20}}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Staff Directory</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput 
          style={styles.searchInput} 
          placeholder="Search name, role, username..." 
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? <ActivityIndicator size="large" color="#800000" /> : 
        <FlatList 
          data={filteredStaff}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={<Text style={{textAlign:'center', marginTop:20, color:'#999'}}>No staff members found.</Text>}
        />
      }

      {/* REUSABLE MODAL (Works for both Add and Edit) */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{isEditing ? 'Edit Staff' : 'Add New Staff'}</Text>
            
            <TextInput 
              placeholder="Full Name" 
              style={styles.input} 
              value={form.full_name} 
              onChangeText={t => setForm({...form, full_name: t})} 
            />
            <TextInput 
              placeholder="Username" 
              style={styles.input} 
              value={form.username} 
              onChangeText={t => setForm({...form, username: t})} 
              autoCapitalize="none"
            />
            
            <Text style={styles.label}>Select Role:</Text>
            <View style={styles.roleRow}>
              {['Doctor', 'Nurse', 'Admin'].map(r => (
                <TouchableOpacity 
                  key={r} 
                  style={[styles.roleOption, form.role === r && styles.roleActive]}
                  onPress={() => setForm({...form, role: r})}
                >
                  <Text style={[styles.roleText, form.role === r && styles.roleTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                <Text style={[styles.btnText, {color: '#fff'}]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold' },
  addBtn: { backgroundColor: '#800000', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  addText: { color: '#fff', fontWeight: 'bold' },
  
  searchContainer: { paddingHorizontal: 20, marginTop: 10 },
  searchInput: { backgroundColor: '#fff', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#ddd' },

  card: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 1 },
  cardContent: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold' },
  user: { color: '#888', fontSize: 12, marginTop: 5 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5, marginVertical: 2 },
  
  actions: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconBtn: { padding: 5 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, marginBottom: 10 },
  label: { marginTop: 10, marginBottom: 5, fontWeight: '600', color: '#666' },
  roleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  roleOption: { padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, width: '30%', alignItems: 'center' },
  roleActive: { backgroundColor: '#800000', borderColor: '#800000' },
  roleText: { color: '#666' },
  roleTextActive: { color: '#fff' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { padding: 12 },
  saveBtn: { backgroundColor: '#800000', padding: 12, borderRadius: 8 },
  btnText: { fontWeight: 'bold' }
});