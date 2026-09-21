import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../utils/supabase";
import { tripStyles } from "../../utils/tripStyles";

export default function Itinerary({ route }) {
  const { tripId } = route.params;
  const [trip, setTrip] = useState(null);
  const [itinerary, setItinerary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Modal states for adding/editing activity
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [activity, setActivity] = useState("");
  const [time, setTime] = useState("");
  const [address, setAddress] = useState("");
  const [budget, setBudget] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Fetch trip data, itinerary, and admin status
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch trip details
        const { data: tripData } = await supabase
          .from("trips")
          .select("*")
          .eq("id", tripId)
          .single();
        setTrip(tripData);

        // Fetch itinerary for the trip, sorted by date & time
        const { data: itineraryData } = await supabase
          .from("itinerary")
          .select("*")
          .eq("trip_id", tripId)
          .order("date", { ascending: true })
          .order("time", { ascending: true });
        setItinerary(itineraryData || []);

        // Check if current user is admin for this trip
        const { data: user } = await supabase.auth.getUser();
        const { data: memberData } = await supabase
          .from("members")
          .select("is_admin")
          .eq("trip_id", tripId)
          .eq("user_id", user.user.id)
          .single();
        setIsAdmin(memberData?.is_admin || false);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tripId]);

  // Show loader while fetching data
  if (loading || !trip) {
    return (
      <View style={[tripStyles.centered, { flex: 1 }]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Generate array of dates between trip.from_date and trip.to_date
  const generateDates = (from, to) => {
    const dates = [];
    let current = new Date(from);
    const end = new Date(to);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };
  const tripDates = generateDates(trip.from_date, trip.to_date);

  // Refresh itinerary data from Supabase
  const refreshItinerary = async () => {
    const { data: itineraryData, error } = await supabase
      .from("itinerary")
      .select("*")
      .eq("trip_id", tripId)
      .order("date", { ascending: true })
      .order("time", { ascending: true });
    if (error) return console.error(error);
    setItinerary(itineraryData || []);
  };

  // Add or Edit activity
  const saveActivity = async () => {
    if (!selectedDate || !activity) return;

    let timeValue = null;
    if (time) {
      // Validate HH:MM
      const [hours, minutes] = time.split(":").map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        // Construct ISO string in local time
        const dateObj = new Date(selectedDate);
        dateObj.setHours(hours, minutes, 0, 0);
        timeValue = dateObj.toISOString();
      } else {
        Alert.alert("Invalid time", "Please enter time in HH:MM format.");
        return;
      }
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from("itinerary")
          .update({
            date: selectedDate,
            time: timeValue,
            activity,
            address,
            budget: budget ? parseFloat(budget) : null,
          })
          .eq("id", editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("itinerary").insert([
          {
            trip_id: tripId,
            date: selectedDate,
            time: timeValue,
            activity,
            address,
            budget: budget ? parseFloat(budget) : null,
          },
        ]);
        if (error) throw error;
      }

      await refreshItinerary();
      setModalVisible(false);
      setActivity("");
      setTime("");
      setAddress("");
      setBudget("");
      setEditingId(null);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to save activity");
    }
  };

  // Delete an activity
  const deleteActivity = (id) => {
    Alert.alert("Delete Activity", "Are you sure you want to delete this activity?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("itinerary").delete().eq("id", id);
          if (error) return console.error(error);
          await refreshItinerary();
        },
      },
    ]);
  };

  // Open modal to edit an activity
  const editActivity = (act) => {
    setSelectedDate(act.date);
    setActivity(act.activity);
    setTime(act.time ? new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : "");
    setAddress(act.address || "");
    setBudget(act.budget?.toString() || "");
    setEditingId(act.id);
    setModalVisible(true);
  };

  return (
    <View style={[tripStyles.container, { flex: 1 }]}>
      {/* Header */}
      <View style={tripStyles.titleContainer}>
        <Text style={tripStyles.title}>Itinerary</Text>
      </View>

      {/* List of trip dates */}
      <FlatList
        data={tripDates}
        keyExtractor={(date, index) => index.toString()}
        renderItem={({ item: dateObj, index }) => {
          const dateStr = dateObj.toISOString().split("T")[0];
          const activitiesForDay = itinerary.filter((i) => i.date === dateStr);

          return (
            <View style={{ marginBottom: 20 }}>
              {/* Date header with optional add button for admin */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontWeight: "bold", fontSize: 18 }}>
                  Day {index + 1}: {dateObj.toDateString()}
                </Text>
                {isAdmin && (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedDate(dateStr);
                      setModalVisible(true);
                      setEditingId(null);
                      setActivity("");
                      setTime("");
                      setAddress("");
                      setBudget("");
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={22} color="#007AFF" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Activities for the day */}
              {activitiesForDay.length > 0 ? (
                activitiesForDay.map((act) => (
                  <View key={act.id} style={tripStyles.card}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <View>
                        <Text style={tripStyles.cardActivity}>{act.activity}</Text>
                        <Text style={tripStyles.cardText}>
                          Time: {act.time ? new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A'}
                        </Text>

                        {act.address && <Text style={tripStyles.cardText}>Location: {act.address}</Text>}
                        {act.budget && <Text style={tripStyles.cardText}>Budget: ${act.budget}</Text>}
                      </View>

                      {/* Edit/Delete buttons for admin */}
                      {isAdmin && (
                        <View style={{ flexDirection: "row" }}>
                          <TouchableOpacity onPress={() => editActivity(act)} style={{ marginRight: 10 }}>
                            <Ionicons name="create-outline" size={20} color="blue" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => deleteActivity(act.id)}>
                            <Ionicons name="trash-outline" size={20} color="red" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <Text style={tripStyles.smallText}>No activities yet.</Text>
              )}
            </View>
          );
        }}
      />

      {/* Modal for adding/editing activity */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={tripStyles.modalContainer}>
          <View style={tripStyles.modalContent}>
            <Text style={tripStyles.sectionTitle}>{editingId ? "Edit Activity" : "Add Activity"}</Text>

            <TextInput style={tripStyles.input} placeholder="Activity" value={activity} onChangeText={setActivity} />
            <TextInput style={tripStyles.input} placeholder="Time (HH:MM)" value={time} onChangeText={setTime} />
            <TextInput style={tripStyles.input} placeholder="Address" value={address} onChangeText={setAddress} />
            <TextInput
              style={tripStyles.input}
              placeholder="Budget"
              keyboardType="numeric"
              value={budget}
              onChangeText={setBudget}
            />

            {/* Save button */}
            <TouchableOpacity onPress={saveActivity} style={tripStyles.button}>
              <Text style={tripStyles.buttonText}>{editingId ? "Save" : "Add"}</Text>
            </TouchableOpacity>

            {/* Cancel button */}
            <TouchableOpacity onPress={() => setModalVisible(false)} style={tripStyles.cancelButton}>
              <Text>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
