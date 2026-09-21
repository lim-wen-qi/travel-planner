import React, { useEffect, useState, useCallback } from "react";
import { View, ScrollView, ActivityIndicator, Alert, TouchableOpacity, FlatList, Text } from "react-native";
import { supabase } from "../../utils/supabase";
import AddExpenseModal from "../../components/Expenses/AddExpenseModal";
import ExpensesList from "../../components/Expenses/ExpensesList";
import SummaryList from "../../components/Expenses/SummaryList";
import { tripStyles } from "../../utils/tripStyles";
import { Ionicons } from "@expo/vector-icons";

export default function Expenses({ route }) {
  const { tripId } = route.params;
  const [expenses, setExpenses] = useState([]);
  const [splits, setSplits] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch members, expenses, and splits
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch trip members with profile info
      const { data: memData } = await supabase
        .from("members")
        .select("user_id, profiles(username, full_name)")
        .eq("trip_id", tripId);
      setMembers(memData || []);

      // Fetch all expenses for this trip
      const { data: expData } = await supabase
        .from("expenses")
        .select("*")
        .eq("trip_id", tripId)
        .order("created_at", { ascending: false });
      setExpenses(expData || []);

      // Fetch expense splits for the fetched expenses
      const { data: splitData } = await supabase
        .from("expense_splits")
        .select(`id, user_id, amount, expense_id, expenses(id, paid_by)`)
        .in("expense_id", expData.map((e) => e.id));
      setSplits(splitData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  // Fetch data on mount or when tripId changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Delete an expense
  const handleDeleteExpense = (expenseId) => {
    Alert.alert("Delete Expense", "Are you sure you want to delete this expense?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            // Delete related splits first (in case no cascade delete)
            await supabase.from("expense_splits").delete().eq("expense_id", expenseId);

            // Delete the expense itself
            const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
            if (error) throw error;

            // Refresh the data after deletion
            fetchData();
          } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to delete expense");
          }
        },
      },
    ]);
  };

  // Show loading spinner while fetching data
  if (loading) {
    return (
      <View style={[tripStyles.centered, { flex: 1 }]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={[tripStyles.container, { flex: 1 }]}>
      {/* Header */}
      <View style={tripStyles.titleContainer}>
        <Text style={tripStyles.title}>Expenses</Text>
      </View>

      {/* Add Expense Modal */}
      <AddExpenseModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        members={members}
        tripId={tripId}
        onExpenseAdded={fetchData}
      />

      {/* Scrollable lists for expenses and summary */}
      <ScrollView style={{ flex: 1 }}>
        <ExpensesList expenses={expenses} members={members} onDelete={handleDeleteExpense} />
        <SummaryList splits={splits} members={members} />
      </ScrollView>

      {/* Floating "+" Button to add new expense */}
      <TouchableOpacity style={tripStyles.fab} onPress={() => setShowAddModal(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
