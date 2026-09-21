import React from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { tripStyles } from "../../utils/tripStyles";

/* ===========================
   ExpensesList Component
   ---------------------------
   -- expenses: array of expense objects
   -- members: array of trip members (with profiles)
   -- onDelete: function → called when an expense is deleted
=========================== */
export default function ExpensesList({ expenses, members, onDelete }) {
  /* ===========================
     Helper function:
     Given a user_id → return username
     If not found, fallback to "Unknown"
  ============================ */
  const getUsername = (userId) => {
    const member = members.find((m) => m.user_id === userId);
    return member?.profiles?.username || "Unknown";
  };

  /* ===========================
     Case: No expenses to show
     Display placeholder text
  ============================ */
  if (!expenses || expenses.length === 0) {
    return (
      <Text style={{ marginTop: 20, textAlign: "center" }}>
        No expenses yet
      </Text>
    );
  }

  /* ===========================
     Render expenses list
     Each row shows:
     -- Title
     -- Paid by (username)
     -- Amount
     -- Delete button (trash icon)
  ============================ */
  return (
    <View>
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const paidByName = getUsername(item.paid_by);

          return (
            <View style={tripStyles.row}>
              {/* Expense Info */}
              <View style={{ flex: 1 }}>
                <Text style={tripStyles.titleLabel}>{item.title}</Text>
                <Text style={tripStyles.label}>Paid by: {paidByName}</Text>
                <Text style={tripStyles.label}>
                  Amount: ${item.amount?.toFixed(2)}
                </Text>
              </View>

              {/* Delete Button */}
              <TouchableOpacity
                style={tripStyles.deleteBtn}
                onPress={() => onDelete?.(item.id)}
              >
                <Ionicons name="trash-outline" size={20} color="red" />
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}
