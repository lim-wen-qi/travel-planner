import React, { useState, useEffect } from "react";
import {
  Modal,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../utils/supabase";
import { tripStyles } from "../../utils/tripStyles";

/* ===========================
   AddExpenseModal Component
   ---------------------------
   -- visible: boolean → controls modal visibility
   -- onClose: function → closes modal
   -- members: array → list of trip members
   -- tripId: number → current trip ID
   -- onExpenseAdded: function → callback after expense is added
=========================== */
export default function AddExpenseModal({ visible, onClose, members, tripId, onExpenseAdded }) {
  // Form states
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(null);
  const [splitAmounts, setSplitAmounts] = useState({});

  /* ===========================
     Auto-split expense equally
     Whenever "amount" or "members" changes:
     -- Calculate per-person share
     -- Update splitAmounts state
  ============================ */
  useEffect(() => {
    if (members.length > 0 && amount) {
      const perPerson = parseFloat(amount) / members.length;
      const splits = {};
      members.forEach((m) => (splits[m.user_id] = perPerson.toFixed(2)));
      setSplitAmounts(splits);
    }
  }, [members, amount]);

  /* ===========================
     addExpense function
     -- Insert new expense into "expenses" table
     -- Insert individual splits into "expense_splits" table
     -- Reset form & close modal
  ============================ */
  const addExpense = async () => {
    if (!title || !amount || !paidBy) return;

    // Insert expense into DB
    const { data: expData, error } = await supabase
      .from("expenses")
      .insert({
        trip_id: tripId,
        title,
        amount: parseFloat(amount),
        paid_by: paidBy,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding expense:", error);
      return;
    }

    // Prepare splits for each member
    const splitArray = members.map((m) => ({
      expense_id: expData.id,
      user_id: m.user_id,
      amount: parseFloat(splitAmounts[m.user_id]),
    }));

    // Insert splits into DB
    const { error: splitError } = await supabase
      .from("expense_splits")
      .insert(splitArray);

    if (splitError) {
      console.error("Split insert error:", splitError);
      return;
    }

    // Reset state & notify parent
    onClose();
    setTitle("");
    setAmount("");
    setPaidBy(null);
    setSplitAmounts({});
    onExpenseAdded?.();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={tripStyles.modalContainer}>
          <View style={tripStyles.modalContent}>
            <ScrollView>
              {/* Modal Title */}
              <Text style={tripStyles.titleLabel}>Add Expense</Text>

              {/* Expense Title Input */}
              <TextInput
                placeholder="Title"
                value={title}
                onChangeText={setTitle}
                style={tripStyles.input}
              />

              {/* Expense Amount Input */}
              <TextInput
                placeholder="Amount"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                style={tripStyles.input}
              />

              {/* Paid By Selection */}
              <Text style={[tripStyles.label, { marginTop: 10 }]}>Paid by:</Text>
              <ScrollView horizontal style={{ marginVertical: 10 }}>
                {members.map((m) => (
                  <TouchableOpacity
                    key={m.user_id}
                    style={[
                      tripStyles.paidByButton,
                      { backgroundColor: paidBy === m.user_id ? "#007AFF" : "#eee" },
                    ]}
                    onPress={() => setPaidBy(m.user_id)}
                  >
                    {/* Show username/full_name */}
                    <Text style={{ color: paidBy === m.user_id ? "white" : "black" }}>
                      {m.profiles.username || m.profiles.full_name}
                    </Text>
                    {/* Show checkmark if selected */}
                    {paidBy === m.user_id && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color="white"
                        style={{ marginLeft: 5 }}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Expense Splits Preview */}
              {amount && (
                <View style={{ marginTop: 20 }}>
                  <Text style={tripStyles.sectionTitle}>Split (equally)</Text>
                  {members.map((m) => (
                    <View key={m.user_id} style={tripStyles.splitRow}>
                      <Text>{m.profiles.full_name || m.profiles.username}</Text>
                      <Text>${splitAmounts[m.user_id]}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Save Expense Button */}
              <TouchableOpacity onPress={addExpense} style={tripStyles.button}>
                <Text style={tripStyles.buttonText}>Save Expense</Text>
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity onPress={onClose} style={tripStyles.cancelButton}>
                <Text>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
