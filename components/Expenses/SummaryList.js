import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { tripStyles } from "../../utils/tripStyles";

export default function SummaryList({ splits, members }) {
  if (!members || !splits) return null;

  // Calculate net balances
  const balances = {};
  members.forEach((m) => (balances[m.user_id] = 0));

  splits.forEach((split) => {
    balances[split.user_id] -= split.amount; // debtor
    const creditorId = split.paid_by || split.expenses?.paid_by;
    if (creditorId) balances[creditorId] += split.amount; // creditor
  });

  // Determine receivers and debtors
  const receivers = Object.entries(balances)
    .filter(([_, amt]) => amt > 0)
    .map(([uid, amount]) => ({ uid, amount }));

  const debtors = Object.entries(balances)
    .filter(([_, amt]) => amt < 0)
    .map(([uid, amount]) => ({ uid, amount: -amount }));

  const finalDebts = [];

  debtors.forEach((debtor) => {
    let remaining = debtor.amount;

    receivers.forEach((rec) => {
      if (rec.amount <= 0 || remaining <= 0) return;

      const pay = Math.min(remaining, rec.amount);

      finalDebts.push({
        from: debtor.uid,
        to: rec.uid,
        amount: pay,
      });

      rec.amount -= pay;
      remaining -= pay;
    });
  });

  return (
    <View style={{ marginTop: 20 }}>
      <Text style={tripStyles.titleLabel}>
        Summary
      </Text>

      {finalDebts.map((d, idx) => {
        const fromMember = members.find((m) => m.user_id === d.from);
        const toMember = members.find((m) => m.user_id === d.to);

        const fromName = fromMember?.profiles?.username || "Unknown";
        const toName = toMember?.profiles?.username || "Unknown";

        return (
          <View key={idx} style={tripStyles.summaryRow}>
            <Text style={tripStyles.label}>
              {fromName} owes {toName}: ${d.amount.toFixed(2)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
