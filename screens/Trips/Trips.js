import React, { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../utils/supabase";
import { tripStyles } from "../../utils/tripStyles";

export default function Trips({ navigation }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch trips function
  const fetchTrips = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch trips created by the user
      const { data: createdTrips, error: createdError } = await supabase
        .from("trips")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });
      if (createdError) console.error("Error fetching created trips:", createdError.message);

      // Fetch trips where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from("members")
        .select("trip_id")
        .eq("user_id", user.id);
      if (memberError) console.error("Error fetching member trips:", memberError.message);

      let memberTrips = [];
      if (memberData?.length) {
        // Get full trip details for member trips
        const memberTripIds = memberData.map((m) => m.trip_id);
        const { data: fetchedMemberTrips, error: memberTripsError } = await supabase
          .from("trips")
          .select("*")
          .in("id", memberTripIds)
          .order("created_at", { ascending: false });
        if (memberTripsError) console.error("Error fetching member trips:", memberTripsError.message);
        else memberTrips = fetchedMemberTrips;
      }

      // Combine trips and remove duplicates
      const allTrips = [...createdTrips, ...memberTrips].filter(
        (v, i, a) => a.findIndex((t) => t.id === v.id) === i
      );

      setTrips(allTrips);
    } catch (err) {
      console.error("Unexpected error fetching trips:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch trips when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchTrips();
    }, [])
  );

  // Show loading spinner while fetching
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, padding: 20 }}>
      {/* Header with title and buttons */}
      <View
        style={[
          tripStyles.titleContainer,
          { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
        ]}
      >
        <Text style={tripStyles.title}>My Trips</Text>

        {/* Notification & Add Trip buttons */}
        <View style={{ flexDirection: "row", gap: 15 }}>
          <TouchableOpacity onPress={() => navigation.navigate("Notifications")}>
            <Ionicons name="notifications-outline" size={32} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("CreateTrip")}>
            <Ionicons name="add-circle" size={32} color="#0035FF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* List of trips */}
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingTop: 10 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={tripStyles.listContainer}
            onPress={() => navigation.navigate("TripDetails", { tripId: item.id })}
          >
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>{item.title}</Text>
            <Text style={{ marginBottom: 5 }}>
              {new Date(item.from_date).toDateString()} - {new Date(item.to_date).toDateString()}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
              <Ionicons name="location-outline" size={16} color="#555" style={{ marginRight: 5 }} />
              <Text style={{ color: "#555" }}>{item.location}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20, color: "#666" }}>
            No trips yet.
          </Text>
        }
      />
    </SafeAreaView>
  );
}
