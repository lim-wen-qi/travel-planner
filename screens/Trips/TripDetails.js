import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { supabase } from "../../utils/supabase";
import { tripStyles } from "../../utils/tripStyles";
import Overview from "./Overview";
import Itinerary from "./Itinerary";
import Expenses from "./Expenses";
import Members from "./Members";

// Create the top tab navigator
const Tab = createMaterialTopTabNavigator();

export default function TripDetails({ route, navigation }) {
  const { tripId } = route.params;
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch trip details from Supabase on mount
  useEffect(() => {
    const fetchTrip = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("trips")
          .select("*")
          .eq("id", tripId)
          .single();

        if (error) throw error;
        setTrip(data); // store trip info
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrip();
  }, [tripId]);

  // Show loading indicator while fetching trip
  if (loading || !trip) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={tripStyles.safeArea}>
      <View style={[tripStyles.container, { flex: 1 }]}>
        {/* Header with back button */}
        <View style={tripStyles.titleWithBackContainer}>
          <TouchableOpacity onPress={() => navigation.popToTop()} style={{ marginRight: 10 }}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={tripStyles.title}>Trip Details</Text>
        </View>

        {/* Material top tabs for different sections */}
        <Tab.Navigator
          screenOptions={{
            tabBarIndicatorStyle: { backgroundColor: "#007AFF" }, // indicator color
            tabBarShowLabel: false, // hide labels, show only icons
          }}
        >
          {/* Overview tab */}
          <Tab.Screen
            name="Overview"
            component={Overview}
            initialParams={{ tripId: trip?.id }} // pass tripId to tab
            options={{
              tabBarIcon: ({ color, size }) => <Ionicons name="reorder-three-outline" color={color} size={size} />,
            }}
          />

          {/* Itinerary tab */}
          <Tab.Screen
            name="Itinerary"
            component={Itinerary}
            initialParams={{ tripId: trip?.id }}
            options={{
              tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size} />,
            }}
          />

          {/* Expenses tab */}
          <Tab.Screen
            name="Expenses"
            component={Expenses}
            initialParams={{ tripId: trip?.id }}
            options={{
              tabBarIcon: ({ color, size }) => <Ionicons name="cash-outline" color={color} size={size} />,
            }}
          />

          {/* Members tab */}
          <Tab.Screen
            name="Members"
            component={Members}
            initialParams={{ tripId: trip?.id }}
            options={{
              tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" color={color} size={size} />,
            }}
          />
        </Tab.Navigator>
      </View>
    </SafeAreaView>
  );
}
