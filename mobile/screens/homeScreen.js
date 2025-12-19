import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, TextInput, Modal, 
  StyleSheet, Alert, ActivityIndicator 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getInventory, addItem, updateItem, deleteItem } from '../services/inventoryService';

export default function InventoryScreen({ navigation, route }) {
  const user = route.params?.user || { full_name: 'Admin', role: 'System' };
  
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal & Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Form Data
  const [form, setForm] = useState({ name: '', category: 'Medicine', qty: '', unit: 'pcs', exp: '' });

  // --- NEW: Date Picker State ---
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expiryDate, setExpiryDate] = useState(new Date());

  // --- 1. LOAD DATA ---
  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [])
  );

  const loadItems = async () => {
    setLoading(true);
    const data = await getInventory();
    
    const formatted = Array.isArray(data) ? data.map(row => ({
      id: Number(row.id),
      name: row.item_name,
      category: row.category,
      qty: Number(row.quantity),
      unit: row.unit,
      exp: row.expiration_date
    })) : [];

    setItems(formatted);
    setFilteredItems(formatted);
    setLoading(false);
  };

  // --- 2. SEARCH ---
  const handleSearch = (text) => {
    setSearch(text);
    if (text) {
      const lower = text.toLowerCase();
      const filtered = items.filter(item => 
        item.name.toLowerCase().includes(lower) || 
        item.category.toLowerCase().includes(lower)
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems(items);
    }
  };

  // --- 3. STATUS COLORS ---
  const getStatus = (item) => {
    const today = new Date();
    const expDate = item.exp ? new Date(item.exp) : null;
    
    if (expDate && expDate < today) return { text: 'Expired', color: '#b71c1c', bg: '#ffcdd2' }; 
    if (item.qty === 0) return { text: 'Out of Stock', color: '#b71c1c', bg: '#ffcdd2' }; 
    if (item.qty <= 10) return { text: 'Low Stock', color: '#f57f17', bg: '#fff9c4' }; 
    
    return { text: 'In Stock', color: '#1b5e20', bg: '#c8e6c9' }; 
  };

  // --- 4. ADD / EDIT / DELETE ---
  const handleSave = async () => {
    if (!form.name || !form.qty) {
      Alert.alert("Error", "Name and Quantity are required");
      return;
    }

    if (isEditing) {
      await updateItem(editId, form);
      Alert.alert("Success", "Item updated!");
    } else {
      await addItem(form);
      Alert.alert("Success", "Item added!");
    }
    setModalVisible(false);
    loadItems();
  };

  const handleDelete = (id) => {
    Alert.alert("Delete", "Are you sure?", [
      { text: "Cancel" },
      { text: "Delete", style:'destructive', onPress: async () => {
          await deleteItem(id);
          loadItems();
      }}
    ]);
  };

  // --- NEW: Handle Date Selection ---
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
        setExpiryDate(selectedDate);
        // Convert to YYYY-MM-DD
        const formattedDate = selectedDate.toISOString().split('T')[0];
        setForm({ ...form, exp: formattedDate });
    }
  };

  const openAdd = () => {
    setForm({ name: '', category: 'Medicine', qty: '', unit: 'pcs', exp: '' });
    setIsEditing(false);
    setExpiryDate(new Date()); // Reset date picker
    setModalVisible(true);
  };

  const openEdit = (item) => {
    setForm({ 
      name: item.name, category: item.category, 
      qty: String(item.qty), unit: item.unit, exp: item.exp 
    });
    setEditId(item.id);
    setIsEditing(true);
    // If item has an expiration date, set the picker to that date
    if(item.exp) setExpiryDate(new Date(item.exp));
    setModalVisible(true);
  };

  // --- 5. RENDER CARD ---
  const renderItem = ({ item }) => {
    const status = getStatus(item);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={[styles.badge, { backgroundColor: status.bg }]}>
            <Text style={{ color: status.color, fontSize: 10, fontWeight:'bold' }}>{status.text}</Text>
          </View>
        </View>
        <Text style={styles.details}>{item.category} • Exp: {item.exp || 'N/A'}</Text>
        
        <View style={styles.cardFooter}>
          <Text style={styles.qty}>{item.qty} {item.unit}</Text>
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}><Text>✏️</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn}><Text>🗑️</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER with User Info */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Welcome,</Text>
          <Text style={styles.user}>{user.full_name}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* DASHBOARD NAVIGATION */}
      <View style={styles.navContainer}>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('Staff')}>
          <Text style={styles.navIcon}>👥</Text>
          <Text style={styles.navText}>Staff</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('Patients')}>
          <Text style={styles.navIcon}>📋</Text>
          <Text style={styles.navText}>Patients</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('Transactions')}>
          <Text style={styles.navIcon}>📊</Text>
          <Text style={styles.navText}>History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('Reports')}>
          <Text style={styles.navIcon}>📈</Text>
          <Text style={styles.navText}>Reports</Text>
        </TouchableOpacity>
      </View>

      {/* INVENTORY LIST */}
      <View style={styles.controls}>
        <TextInput 
          style={styles.search} 
          placeholder="Search inventory..." 
          value={search}
          onChangeText={handleSearch}
        />
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={{color:'#fff', fontWeight:'bold'}}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator size="large" color="#800000" style={{marginTop:20}} /> : 
        <FlatList 
          data={filteredItems}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingTop: 0 }}
          ListEmptyComponent={<Text style={styles.empty}>No items found.</Text>}
        />
      }

      {/* MODAL POPUP */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{isEditing ? 'Edit Item' : 'Add Item'}</Text>
            
            <TextInput placeholder="Item Name" style={styles.input} value={form.name} onChangeText={t=>setForm({...form, name:t})} />
            <TextInput placeholder="Category" style={styles.input} value={form.category} onChangeText={t=>setForm({...form, category:t})} />
            
            <View style={{flexDirection:'row', gap: 10}}>
              <TextInput placeholder="Qty" keyboardType="numeric" style={[styles.input, {flex:1}]} value={form.qty} onChangeText={t=>setForm({...form, qty:t})} />
              <TextInput placeholder="Unit" style={[styles.input, {flex:1}]} value={form.unit} onChangeText={t=>setForm({...form, unit:t})} />
            </View>

            {/* --- NEW: DATE PICKER BUTTON --- */}
            <Text style={{fontWeight:'bold', marginBottom:5}}>Expiration Date:</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateText}>
                    {form.exp ? form.exp : "Select Date"}
                </Text>
            </TouchableOpacity>

            {showDatePicker && (
                <DateTimePicker
                    value={expiryDate}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                />
            )}
            {/* ------------------------------- */}

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                <Text style={{color:'#fff'}}>Save</Text>
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
  welcome: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  user: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  logoutBtn: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 8, borderRadius: 8 },
  logoutText: { color: '#fff', fontSize: 12 },

  navContainer: { flexDirection: 'row', backgroundColor: '#fff', padding: 10, elevation: 2, justifyContent: 'space-around', marginBottom: 10 },
  navBtn: { alignItems: 'center', padding: 5, borderRadius: 8, width: 70 },
  navIcon: { fontSize: 20, marginBottom: 2 },
  navText: { fontSize: 11, color: '#555', fontWeight: '600' },

  controls: { paddingHorizontal: 20, marginBottom: 10, flexDirection: 'row', gap: 10 },
  search: { flex: 1, backgroundColor: '#fff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  addBtn: { backgroundColor: '#800000', justifyContent: 'center', paddingHorizontal: 15, borderRadius: 8 },

  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  details: { color: '#666', fontSize: 12, marginBottom: 10 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qty: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  actions: { flexDirection: 'row', gap: 15 },
  iconBtn: { padding: 5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, marginBottom: 10 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  cancelBtn: { padding: 10 },
  saveBtn: { backgroundColor: '#800000', padding: 10, borderRadius: 8 },
  empty: { textAlign: 'center', marginTop: 20, color: '#999' },
  
  dateButton: { backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8, marginBottom: 15, alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  dateText: { fontSize: 16, color: '#333' }
});