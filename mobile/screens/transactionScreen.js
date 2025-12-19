import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, TextInput, Modal, 
  StyleSheet, Alert, ActivityIndicator, ScrollView 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker'; 
import { getTransactions, addTransaction } from '../services/transactionService';
import { getStaff } from '../services/staffService';
import { getPatients } from '../services/patientService';
import { getInventory } from '../services/inventoryService';

export default function TransactionScreen() {
  const [trans, setTrans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Dropdown Data
  const [staffList, setStaffList] = useState([]);
  const [patientList, setPatientList] = useState([]);
  const [itemList, setItemList] = useState([]);

  // Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateObject, setDateObject] = useState(new Date());

  // Form State
  const [form, setForm] = useState({
    staffId: '', 
    patId: '', // Changed null to empty string for Picker compatibility
    itemId: '', 
    qty: '', 
    type: 'Dispense', 
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    // Fetch everything in parallel
    const [tData, sData, pData, iData] = await Promise.all([
      getTransactions(),
      getStaff(),
      getPatients(),
      getInventory()
    ]);

    setTrans(tData);
    setStaffList(sData);
    setPatientList(pData);
    setItemList(iData);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.staffId || !form.itemId || !form.qty) {
      Alert.alert("Error", "Staff, Item, and Quantity are required");
      return;
    }
    if (form.type === 'Dispense' && !form.patId) {
      Alert.alert("Error", "Please select a patient for dispensing");
      return;
    }

    const payload = {
        ...form,
        qty: Number(form.qty),
        staffId: Number(form.staffId),
        itemId: Number(form.itemId),
        patId: form.patId ? Number(form.patId) : null
    };

    const res = await addTransaction(payload);
    if (res.success) {
      Alert.alert("Success", "Transaction Saved");
      setModalVisible(false);
      // Reset form (optional)
      setForm({...form, qty: '', itemId: '', patId: ''}); 
      loadAllData(); 
    } else {
      Alert.alert("Error", "Failed to save");
    }
  };

  // Date Change Handler
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
        setDateObject(selectedDate);
        setForm({ ...form, date: selectedDate.toISOString().split('T')[0] });
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.date}>{item.transaction_date}</Text>
        <Text style={[styles.type, item.transaction_type === 'Dispense' ? styles.dispense : styles.restock]}>
          {item.transaction_type}
        </Text>
      </View>
      <Text style={styles.mainText}>Item: {item.item_name}</Text>
      <Text style={styles.subText}>Staff: {item.staff_name}</Text>
      {item.patient_name && <Text style={styles.subText}>Patient: {item.patient_name}</Text>}
      
      <Text style={styles.qty}>
        {item.transaction_type === 'Dispense' ? '-' : '+'}{item.quantity}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator size="large" color="#800000" /> : 
        <FlatList 
          data={trans}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No transactions yet.</Text>}
        />
      }

      {/* ADD TRANSACTION MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Transaction</Text>
            
            {/* Type Selector */}
            <View style={styles.row}>
              <TouchableOpacity onPress={() => setForm({...form, type:'Dispense'})} style={[styles.typeBtn, form.type==='Dispense' && styles.dispenseBg]}>
                <Text>Dispense (-)</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setForm({...form, type:'Restock', patId: ''})} style={[styles.typeBtn, form.type==='Restock' && styles.restockBg]}>
                <Text>Restock (+)</Text>
              </TouchableOpacity>
            </View>

            {/* --- DATE PICKER --- */}
            <Text style={styles.label}>Transaction Date:</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateText}>{form.date}</Text>
            </TouchableOpacity>
            {showDatePicker && (
                <DateTimePicker value={dateObject} mode="date" display="default" onChange={onDateChange} />
            )}

            {/* --- STAFF PICKER --- */}
            <Text style={styles.label}>Staff Member:</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={form.staffId}
                    onValueChange={(val) => setForm({...form, staffId: val})}
                >
                    <Picker.Item label="Select Staff..." value="" />
                    {staffList.map((s) => (
                        // Adapting to whatever key your staff object uses (full_name or name)
                        <Picker.Item key={s.id} label={s.full_name || s.name} value={s.id} />
                    ))}
                </Picker>
            </View>

            {/* --- ITEM PICKER --- */}
            <Text style={styles.label}>Inventory Item:</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={form.itemId}
                    onValueChange={(val) => setForm({...form, itemId: val})}
                >
                    <Picker.Item label="Select Item..." value="" />
                    {itemList.map((i) => (
                        <Picker.Item key={i.id} label={i.item_name || i.name} value={i.id} />
                    ))}
                </Picker>
            </View>

            {/* --- PATIENT PICKER (Only if Dispensing) --- */}
            {form.type === 'Dispense' && (
                <>
                <Text style={styles.label}>Patient:</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={form.patId}
                        onValueChange={(val) => setForm({...form, patId: val})}
                    >
                        <Picker.Item label="Select Patient..." value="" />
                        {patientList.map((p) => (
                            <Picker.Item key={p.id} label={p.full_name || p.name} value={p.id} />
                        ))}
                    </Picker>
                </View>
                </>
            )}

            {/* Quantity */}
            <Text style={styles.label}>Quantity:</Text>
            <TextInput 
                style={styles.input} 
                value={form.qty} 
                onChangeText={t => setForm({...form, qty:t})} 
                keyboardType="numeric" 
                placeholder="0" 
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.saveBtn}><Text style={{color:'#fff'}}>Save</Text></TouchableOpacity>
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
  addBtn: { backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  addText: { color: '#800000', fontWeight: 'bold' },

  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2 },
  cardHeader: { flexDirection:'row', justifyContent:'space-between' },
  date: { color: '#999', fontSize: 12 },
  type: { fontWeight: 'bold', fontSize: 12 },
  dispense: { color: 'red' },
  restock: { color: 'green' },
  mainText: { fontSize: 16, fontWeight: 'bold', marginTop: 5 },
  subText: { color: '#666', fontSize: 14 },
  qty: { position: 'absolute', right: 15, top: 40, fontSize: 20, fontWeight: 'bold' },
  emptyText: { textAlign:'center', marginTop:20, color:'#888' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 15, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, marginBottom: 15 },
  label: { fontWeight: 'bold', marginBottom: 5, color: '#333' },
  
  // Date Button Style
  dateButton: { backgroundColor: '#f9f9f9', padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 15 },
  dateText: { color: '#333' },

  // Picker Style
  pickerContainer: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 15, backgroundColor: '#f9f9f9', overflow: 'hidden' },

  row: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  typeBtn: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center', borderRadius: 5 },
  dispenseBg: { backgroundColor: '#ffebee', borderColor: 'red' },
  restockBg: { backgroundColor: '#e8f5e9', borderColor: 'green' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 15 },
  cancelBtn: { padding: 10 },
  saveBtn: { backgroundColor: '#800000', padding: 10, borderRadius: 8 }
});