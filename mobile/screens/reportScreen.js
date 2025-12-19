import React, { useEffect, useState } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, StyleSheet, 
  ActivityIndicator, Alert, RefreshControl 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker'; 
import { getInventory } from '../services/inventoryService';
import { getTransactions } from '../services/transactionService';
import { getStaff } from '../services/staffService';
import { getPatients } from '../services/patientService';

export default function ReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data Containers
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [staff, setStaff] = useState([]);
  const [patients, setPatients] = useState([]);

  // Report State
  // Default to current Year-Month (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); 
  const [reportStats, setReportStats] = useState({ dispensed: 0, restock: 0, patientsSeen: 0 });
  const [monthlyTrans, setMonthlyTrans] = useState([]);

  // Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateObject, setDateObject] = useState(new Date());

  useEffect(() => {
    loadAllData();
  }, []);

  // --- 1. LOAD ALL DATA ---
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [invData, transData, staffData, patData] = await Promise.all([
        getInventory(),
        getTransactions(),
        getStaff(),
        getPatients()
      ]);

      // Normalize Inventory Data
      const normInv = Array.isArray(invData) ? invData.map(i => ({
        id: Number(i.id),
        name: i.item_name,
        qty: Number(i.quantity),
        unit: i.unit,
        cat: i.category
      })) : [];

      setInventory(normInv);
      // Ensure transactions is always an array
      const safeTrans = Array.isArray(transData) ? transData : [];
      setTransactions(safeTrans);
      setStaff(Array.isArray(staffData) ? staffData : []);
      setPatients(Array.isArray(patData) ? patData : []);
      
      // Generate initial report for current month
      generateReport(safeTrans, selectedMonth);

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load report data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };

  // --- 2. GENERATE MONTHLY REPORT ---
  const generateReport = (allTrans, monthStr) => {
    if (!monthStr) return;
    const [year, month] = monthStr.split('-'); // e.g., ["2023", "12"]

    // Filter Transactions by Month
    const filtered = allTrans.filter(t => {
      // Handle date strings safely
      const d = new Date(t.transaction_date);
      // getMonth() is 0-indexed, so we add 1
      return d.getFullYear() == year && (d.getMonth() + 1) == month;
    });

    // Calculate Stats
    const dispensed = filtered
      .filter(t => t.transaction_type === 'Dispense')
      .reduce((sum, t) => sum + Number(t.quantity), 0);

    const restock = filtered.filter(t => t.transaction_type === 'Restock').length;

    // Count Unique Patients
    const uniquePatients = new Set(
      filtered
      .filter(t => t.transaction_type === 'Dispense' && t.patient_name)
      .map(t => t.patient_name)
    );

    setMonthlyTrans(filtered);
    setReportStats({
      dispensed,
      restock,
      patientsSeen: uniquePatients.size
    });
  };

  // --- 3. DATE PICKER HANDLER ---
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
        setDateObject(selectedDate);
        
        // Format to YYYY-MM
        const year = selectedDate.getFullYear();
        // Pad month with 0 if needed (e.g., 9 -> 09)
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const newMonthStr = `${year}-${month}`;
        
        setSelectedMonth(newMonthStr);
        generateReport(transactions, newMonthStr);
    }
  };

  // --- 4. HELPER: LOW STOCK ITEMS ---
  const getLowStockItems = () => {
    return inventory.filter(i => i.qty <= 10);
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#800000" style={{flex:1, justifyContent:'center'}} />;
  }

  const lowStock = getLowStockItems();

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>System Analytics</Text>
        <Text style={{color:'rgba(255,255,255,0.7)'}}>Overview & Monthly Reports</Text>
      </View>
        
      {/* --- DASHBOARD SUMMARY --- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.cardVal}>{inventory.length}</Text>
            <Text style={styles.cardLbl}>Total Items</Text>
          </View>
          <View style={[styles.card, {borderColor: lowStock.length > 0 ? '#ffcdd2' : '#c8e6c9'}]}>
            <Text style={[styles.cardVal, {color: lowStock.length > 0 ? '#d32f2f' : '#2e7d32'}]}>
              {lowStock.length}
            </Text>
            <Text style={styles.cardLbl}>Low Stock</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardVal}>{transactions.length}</Text>
            <Text style={styles.cardLbl}>Total Trans.</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardVal}>{patients.length}</Text>
            <Text style={styles.cardLbl}>Patients</Text>
          </View>
        </View>
      </View>

      {/* --- LOW STOCK ALERT --- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚠️ Low Stock Alerts</Text>
        {lowStock.length === 0 ? (
          <Text style={styles.successText}>✅ All items are well stocked.</Text>
        ) : (
          lowStock.map(item => (
            <View key={item.id} style={styles.rowItem}>
              <View>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowSub}>{item.cat}</Text>
              </View>
              <Text style={styles.rowQtyRed}>{item.qty} {item.unit}</Text>
            </View>
          ))
        )}
      </View>

      {/* --- MONTHLY REPORT --- */}
      <View style={[styles.section, {marginBottom: 40}]}>
        <Text style={styles.sectionTitle}>📅 Monthly Report</Text>
        
        {/* Date Selection Area */}
        <View style={styles.filterBox}>
          <Text style={{fontWeight:'bold', color:'#555', marginBottom:5}}>Viewing Data For:</Text>
          
          <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
             <Text style={styles.dateText}>
                 {dateObject.toLocaleString('default', { month: 'long', year: 'numeric' })}
             </Text>
             <Text style={{fontSize:18}}>📅</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
                value={dateObject}
                mode="date"
                display="default"
                onChange={onDateChange}
            />
          )}
        </View>

        {/* Monthly Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{reportStats.patientsSeen}</Text>
            <Text style={styles.statLbl}>Patients</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{reportStats.dispensed}</Text>
            <Text style={styles.statLbl}>Dispensed</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{reportStats.restock}</Text>
            <Text style={styles.statLbl}>Restocks</Text>
          </View>
        </View>

        {/* Monthly Transaction List */}
        <Text style={styles.subHeader}>History ({selectedMonth})</Text>
        {monthlyTrans.length === 0 ? (
          <Text style={styles.emptyText}>No transactions found for this month.</Text>
        ) : (
          monthlyTrans.map((t, index) => (
            <View key={index} style={styles.transRow}>
              <View style={{flex:1}}>
                <Text style={styles.rowName}>{t.item_name}</Text>
                <Text style={styles.rowSub}>{t.transaction_date.split(' ')[0]}</Text>
                {t.patient_name && <Text style={styles.rowSub}>Patient: {t.patient_name}</Text>}
              </View>
              <View style={{alignItems:'flex-end'}}>
                <Text style={[styles.badge, t.transaction_type === 'Dispense' ? styles.badgeDisp : styles.badgeRest]}>
                  {t.transaction_type}
                </Text>
                <Text style={{fontWeight:'bold', marginTop:2, fontSize:16}}>{t.quantity}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  header: { backgroundColor: '#800000', padding: 20, paddingTop: 50 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  
  section: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  
  // Dashboard Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, alignItems: 'center', borderWidth:1, borderColor:'#eee', elevation: 2 },
  cardVal: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  cardLbl: { fontSize: 12, color: '#666' },

  // List Rows
  rowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rowName: { fontSize: 16, fontWeight: '600', color:'#333' },
  rowSub: { fontSize: 12, color: '#888', marginTop: 2 },
  rowQtyRed: { fontSize: 16, fontWeight: 'bold', color: '#d32f2f' },
  successText: { color: '#2e7d32', fontStyle: 'italic', paddingVertical:10 },

  // Filter Box
  filterBox: { backgroundColor: '#f5f5f5', padding: 15, borderRadius: 10, marginBottom: 20 },
  dateSelector: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor:'#fff', padding:12, borderRadius:8, borderWidth:1, borderColor:'#ddd' },
  dateText: { fontSize:16, fontWeight:'bold', color:'#333' },

  // Stats Row
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, backgroundColor:'#fafafa', padding:15, borderRadius:10 },
  statBox: { alignItems: 'center', flex: 1 },
  statVal: { fontSize: 20, fontWeight: 'bold', color: '#800000' },
  statLbl: { fontSize: 12, color: '#555' },
  // Transactions
  subHeader: { fontSize: 16, fontWeight: 'bold', marginTop: 10, marginBottom: 5, color:'#444' },
  transRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  badge: { fontSize: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, overflow: 'hidden', fontWeight: 'bold', color: '#fff' },
  badgeDisp: { backgroundColor: '#ef6c00' }, // Orange
  badgeRest: { backgroundColor: '#2e7d32' },  // Green
  emptyText: { fontStyle:'italic', color:'#888', marginTop:15, textAlign:'center' }
});