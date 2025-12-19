import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, TextInput, Modal, 
  StyleSheet, Alert, ActivityIndicator 
} from 'react-native';
import { getPatients, addPatient, updatePatient, deletePatient } from '../services/patientService';

export default function PatientScreen() {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Form State
  const [form, setForm] = useState({ name: '', role: 'Student', reason: '' });

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setLoading(true);
    const data = await getPatients();
    // Map data to match keys
    const formatted = Array.isArray(data) ? data.map(row => ({
      id: Number(row.id),
      name: row.full_name,
      role: row.role,
      reason: row.reason // Ensure this matches your DB column
    })) : [];
    
    setPatients(formatted);
    setFilteredPatients(formatted);
    setLoading(false);
  };

  const handleSearch = (text) => {
    setSearch(text);
    if (text) {
      const lower = text.toLowerCase();
      const filtered = patients.filter(p => 
        p.name.toLowerCase().includes(lower) || 
        p.role.toLowerCase().includes(lower) ||
        p.reason.toLowerCase().includes(lower)
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.reason) {
      Alert.alert("Error", "Please fill Name and Reason");
      return;
    }

    if (isEditing) {
      await updatePatient(editId, form);
      Alert.alert("Success", "Patient Record Updated");
    } else {
      await addPatient(form);
      Alert.alert("Success", "Patient Record Added");
    }
    setModalVisible(false);
    loadPatients();
  };

  const handleDelete = (id) => {
    Alert.alert("Delete", "Remove this patient record?", [
      { text: "Cancel" },
      { text: "Delete", onPress: async () => {
          await deletePatient(id);
          loadPatients();
      }}
    ]);
  };

  const openAdd = () => {
    setForm({ name: '', role: 'Student', reason: '' });
    setIsEditing(false);
    setModalVisible(true);
  };

  const openEdit = (item) => {
    setForm({ name: item.name, role: item.role, reason: item.reason });
    setEditId(item.id);
    setIsEditing(true);
    setModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.role}</Text>
        </View>
      </View>
      
      <Text style={styles.reasonLabel}>Reason for visit:</Text>
      <Text style={styles.reason}>{item.reason}</Text>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
          <Text>✏️ Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.actionBtn, styles.deleteBtn]}>
          <Text style={{color:'red'}}>🗑️ Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Patient Records</Text>
        <TouchableOpacity onPress={openAdd} style={styles.addButton}>
          <Text style={styles.addText}>+ Add Patient</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput 
          style={styles.searchInput} 
          placeholder="Search patient name, reason..." 
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? <ActivityIndicator size="large" color="#800000" style={{marginTop:20}} /> : 
        <FlatList 
          data={filteredPatients}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={<Text style={styles.empty}>No patient records found.</Text>}
        />
      }

      {/* MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{isEditing ? 'Edit Patient' : 'Add Patient'}</Text>
            
            <TextInput 
              placeholder="Full Name" 
              style={styles.input} 
              value={form.name} 
              onChangeText={t => setForm({...form, name:t})} 
            />
            
            <Text style={styles.label}>Classification:</Text>
            <View style={styles.roleRow}>
                {['Student', 'Teacher', 'Staff'].map(r => (
                    <TouchableOpacity 
                        key={r} 
                        style={[styles.roleBtn, form.role === r && styles.roleBtnActive]}
                        onPress={() => setForm({...form, role:r})}
                    >
                        <Text style={[styles.roleText, form.role === r && styles.roleTextActive]}>{r}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <TextInput 
              placeholder="Reason for Visit" 
              style={[styles.input, {height: 80, textAlignVertical:'top'}]} 
              value={form.reason} 
              onChangeText={t => setForm({...form, reason:t})}
              multiline 
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                <Text style={{color:'#fff', fontWeight:'bold'}}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#800000', padding: 20, paddingTop: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  addButton: { backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  addText: { color: '#800000', fontWeight: 'bold' },
  
  searchContainer: { padding: 15 },
  searchInput: { backgroundColor: '#fff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ddd' },

  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  badge: { backgroundColor: '#e3f2fd', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  badgeText: { color: '#007AFF', fontSize: 12, fontWeight: 'bold' },
  reasonLabel: { fontSize: 12, color: '#888', marginTop: 5 },
  reason: { fontSize: 14, color: '#444', marginBottom: 15 },
  
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
  actionBtn: { padding: 5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 15, fontSize: 16 },
  label: { marginBottom: 10, fontWeight: '600', color: '#666' },
  roleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  roleBtn: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, width: '30%', alignItems: 'center' },
  roleBtnActive: { backgroundColor: '#800000', borderColor: '#800000' },
  roleText: { color: '#666' },
  roleTextActive: { color: '#fff' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  cancelBtn: { padding: 12 },
  saveBtn: { backgroundColor: '#800000', padding: 12, borderRadius: 8 },
  empty: { textAlign: 'center', marginTop: 30, color: '#999' }
});