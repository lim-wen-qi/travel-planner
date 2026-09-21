import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { supabase } from "../../utils/supabase";
import { tripStyles } from "../../utils/tripStyles";

export default function CreateTrip({ navigation }) {
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [countries, setCountries] = useState([]);
  const [query, setQuery] = useState("");

  // Trip dates
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  // Friends
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [showAllFriends, setShowAllFriends] = useState(false);

  // Fetch current user from Supabase Auth
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();
      if (!error && currentUser) setUser(currentUser);
    };
    fetchUser();
  }, []);

  // Fetch all countries for autocomplete input
  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all?fields=name")
      .then((res) => res.json())
      .then((data) => setCountries(data.map((c) => c.name.common).sort()))
      .catch((err) => console.error(err));
  }, []);

  // Fetch current user's friends for invitation
  useEffect(() => {
    if (!user) return;

    const fetchFriends = async () => {
      // Get all accepted friends
      const { data: friendsData, error } = await supabase
        .from("friends")
        .select("sender_id, receiver_id, status")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq("status", "accepted");

      if (error) return console.error("Failed to fetch friends:", error);

      // Extract friend IDs (exclude self)
      const friendIds = friendsData.map(f =>
        f.sender_id === user.id ? f.receiver_id : f.sender_id
      );

      if (friendIds.length === 0) return setFriends([]);

      // Fetch friend profiles
      const { data: friendProfiles, error: profError } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", friendIds);

      if (profError) return console.error("Failed to fetch profiles:", profError);

      setFriends(friendProfiles.map(f => ({ id: f.id, name: f.username })));
    };

    fetchFriends();
  }, [user]);

  // Filter friends by search query
  const filteredFriends = friends.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Limit friends shown unless "see more" is clicked
  const friendsToDisplay = showAllFriends
    ? filteredFriends
    : filteredFriends.slice(0, 10);

  // Toggle friend selection for trip
  const toggleFriendSelection = (id) => {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  // Save trip to Supabase
  const saveTrip = async () => {
    // ✅ Validate inputs
    if (!title || !location) return Alert.alert("Error", "Title and location required");
    if (toDate < fromDate) return Alert.alert("Error", "To Date must be later than From Date");

    // Insert trip
    const { data: trip, error } = await supabase
      .from("trips")
      .insert({
        title,
        location,
        from_date: fromDate,
        to_date: toDate,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating trip:", error);
      return Alert.alert("Error", "Failed to create trip");
    }

    // Add creator + selected friends as members
    const members = [
      { trip_id: trip.id, user_id: user.id, is_admin: true }, // creator
      ...selectedFriends.map((fid) => ({ trip_id: trip.id, user_id: fid, is_admin: false }))
    ];

    const { error: memberError } = await supabase.from("members").insert(members);
    if (memberError) {
      console.error("Error adding members:", memberError);
      return Alert.alert("Error", "Failed to add members");
    }

    Alert.alert("Success", "Trip created!");
    navigation.navigate("TripDetails", { tripId: trip.id, user });
  };

  // Filter countries for autocomplete
  const filteredCountries = countries.filter((c) =>
    c.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <SafeAreaView style={tripStyles.safeArea}>
      <View style={tripStyles.container}>
        {/* Header */}
        <View style={tripStyles.titleWithBackContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 10 }}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={tripStyles.title}>Create A New Trip</Text>
        </View>

        {/* Trip Title */}
        <Text style={tripStyles.label}>Title</Text>
        <TextInput
          style={tripStyles.input}
          placeholder="Enter trip title"
          value={title}
          onChangeText={setTitle}
          placeholderTextColor="#999"
        />

        {/* Location Autocomplete */}
        <Text style={tripStyles.label}>Location</Text>
        <TextInput
          style={tripStyles.input}
          placeholder="Enter destination"
          value={location}
          onChangeText={setLocation}
          placeholderTextColor="#999"
        />

        {/* From & To Dates */}
        <Text style={tripStyles.label}>From Date</Text>
        <TouchableOpacity onPress={() => setShowFromPicker(true)}>
          <Text style={tripStyles.input}>{fromDate.toDateString()}</Text>
        </TouchableOpacity>
        {showFromPicker && (
          <DateTimePicker
            value={fromDate}
            mode="date"
            display="default"
            onChange={(e, date) => { setShowFromPicker(false); if (date) setFromDate(date); }}
          />
        )}

        <Text style={tripStyles.label}>To Date</Text>
        <TouchableOpacity onPress={() => setShowToPicker(true)}>
          <Text style={tripStyles.input}>{toDate.toDateString()}</Text>
        </TouchableOpacity>
        {showToPicker && (
          <DateTimePicker
            value={toDate}
            mode="date"
            display="default"
            onChange={(e, date) => { setShowToPicker(false); if (date) setToDate(date); }}
          />
        )}

        {/* Invite Friends */}
        <Text style={tripStyles.sectionTitle}>Add Members</Text>
        <TextInput
          style={tripStyles.input}
          placeholder="Search friends..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {friendsToDisplay.map((friend) => (
          <TouchableOpacity
            key={friend.id}
            style={[
              tripStyles.friendItem,
              selectedFriends.includes(friend.id) && { backgroundColor: "#d6f5d6" },
            ]}
            onPress={() => toggleFriendSelection(friend.id)}
          >
            <Text style={{ fontSize: 16 }}>{friend.name}</Text>
            {selectedFriends.includes(friend.id) && <Ionicons name="checkmark" size={20} color="green" />}
          </TouchableOpacity>
        ))}
        {filteredFriends.length > 10 && !showAllFriends && (
          <TouchableOpacity onPress={() => setShowAllFriends(true)} style={{ paddingVertical: 8 }}>
            <Text style={{ color: "#007BFF", textAlign: "center" }}>See more...</Text>
          </TouchableOpacity>
        )}

        {/* Save Trip Button */}
        <TouchableOpacity style={tripStyles.button} onPress={saveTrip}>
          <Text style={tripStyles.buttonText}>Save Trip</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
