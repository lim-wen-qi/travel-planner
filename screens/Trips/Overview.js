import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { supabase } from "../../utils/supabase";
import { tripStyles } from "../../utils/tripStyles";
import { Ionicons } from "@expo/vector-icons";
import SummaryList from "../../components/Expenses/SummaryList";
import { Dimensions } from "react-native";
import { PieChart } from "react-native-chart-kit";

export default function Overview({ route, navigation }) {
  const { tripId } = route.params;
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [totalBudget, setTotalBudget] = useState(0);
  const [splits, setSplits] = useState([]);

  // Fetch trip details, members, budgets, expenses, and splits
  useEffect(() => {
    const fetchTripDetails = async () => {
      setLoading(true);

      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id ?? null;
      setCurrentUserId(userId);

      try {
        // Fetch trip details
        const { data: tripData, error: tripError } = await supabase
          .from("trips")
          .select("*")
          .eq("id", tripId)
          .single();
        if (tripError) throw tripError;
        setTrip(tripData);

        // Fetch trip members
        const { data: memberData, error: memberError } = await supabase
          .from("members")
          .select("user_id")
          .eq("trip_id", tripId);
        if (memberError) throw memberError;

        const memberIds = memberData.map((m) => m.user_id);

        // Fetch profiles for each member
        const { data: memberProfiles, error: profileError } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", memberIds);
        if (profileError) throw profileError;

        // Combine member data with profile info
        const membersWithProfiles = memberData.map((m) => ({
          user_id: m.user_id,
          profiles: memberProfiles.find((p) => p.id === m.user_id) || {},
        }));
        setMembers(membersWithProfiles);

        // Fetch itinerary budgets and calculate total
        const { data: itineraryData, error: itineraryError } = await supabase
          .from("itinerary")
          .select("budget")
          .eq("trip_id", tripId);
        if (itineraryError) throw itineraryError;

        const totalBudgetAmount = itineraryData.reduce(
          (acc, item) => acc + (item.budget || 0),
          0
        );
        setTotalBudget(totalBudgetAmount);

        // Fetch expenses
        const { data: expenseData, error: expenseError } = await supabase
          .from("expenses")
          .select("*")
          .eq("trip_id", tripId);
        if (expenseError) throw expenseError;
        setExpenses(expenseData);

        // Fetch expense splits
        const { data: splitData, error: splitError } = await supabase
          .from("expense_splits")
          .select(`*, expenses(paid_by)`)
          .in("expense_id", expenseData.map((e) => e.id));
        if (splitError) throw splitError;
        setSplits(splitData);

      } catch (err) {
        console.error("Error fetching trip details:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [tripId]);

  // Delete trip
  const handleRemoveTrip = async () => {
    Alert.alert(
      "Delete Trip",
      "Are you sure you want to remove this trip?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.from("trips").delete().eq("id", tripId);
            if (error) Alert.alert("Error", "Failed to remove trip");
            else {
              Alert.alert("Trip removed successfully");
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  // Leave trip
  const handleLeaveTrip = async () => {
    Alert.alert(
      "Leave Trip",
      "Are you sure you want to leave this trip?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("members")
              .delete()
              .eq("trip_id", tripId)
              .eq("user_id", currentUserId);
            if (error) Alert.alert("Error", "Failed to leave trip");
            else {
              Alert.alert("You left the trip");
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  // Show loading indicator while fetching data
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Check if current user is the creator
  const isCreator = currentUserId && trip && currentUserId === trip.created_by;

  // Calculate total expenses
  const totalExpenses = expenses.reduce((acc, expense) => acc + expense.amount, 0);

  const chartData = [
  {
    name: "Spent",
    amount: totalExpenses,
    color: "#FF6384", // red/pink
    legendFontColor: "#333",
    legendFontSize: 14,
  },
  {
    name: "Remaining",
    amount: Math.max(totalBudget - totalExpenses, 0),
    color: "#36A2EB", // blue
    legendFontColor: "#333",
    legendFontSize: 14,
  },
];

  return (
    <View style={[tripStyles.container, { flex: 1 }]}>
      {/* Page title */}
      <View style={tripStyles.titleContainer}>
        <Text style={tripStyles.title}>Overview</Text>
      </View>

      {/* Trip details */}
      <View style={{ marginVertical: 10 }}>
        <Text style={tripStyles.titleLabel}>{trip.title}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
          <Ionicons name="location-outline" size={16} color="#555" style={{ marginRight: 5 }} />
          <Text style={tripStyles.label}>{trip.location}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
          <Ionicons name="time-outline" size={16} color="#555" style={{ marginRight: 5 }} />
          <Text style={tripStyles.label}>
            {new Date(trip.from_date).toDateString()} - {new Date(trip.to_date).toDateString()}
          </Text>
        </View>
      </View>

      {/* Budget summary */}
      <View style={{ marginVertical: 10 }}>
        <Text style={tripStyles.titleLabel}>Budget: </Text>
        <Text style={tripStyles.label}>${totalBudget.toFixed(2)}</Text>
      </View>

      {/* Total expenses */}
      <View style={{ marginVertical: 10 }}>
        <Text style={tripStyles.titleLabel}>Expenses: </Text>
        <Text style={tripStyles.label}>${totalExpenses.toFixed(2)}</Text>
      </View>
      {/* Budget vs expenses */}
      <View style={{ marginVertical: 20 }}>
        <Text style={tripStyles.titleLabel}>Budget vs Expenses</Text>
        <PieChart
          data={chartData}
          width={Dimensions.get("window").width - 40}
          height={200}
          chartConfig={{
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="amount"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
          hasLegend={true}
          center={[0, 0]}
          avoidFalseZero
        />
      </View>
      {/* Settlement summary */}
      <SummaryList splits={splits} members={members} />

      {/* Action buttons */}
      {isCreator ? (
        <TouchableOpacity
          style={[tripStyles.button, { backgroundColor: "red", marginTop: 20 }]}
          onPress={handleRemoveTrip}
        >
          <Text style={tripStyles.buttonText}>Remove This Trip</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[tripStyles.button, { backgroundColor: "#FF8C00", marginTop: 20 }]}
          onPress={handleLeaveTrip}
        >
          <Text style={tripStyles.buttonText}>Leave Trip</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
