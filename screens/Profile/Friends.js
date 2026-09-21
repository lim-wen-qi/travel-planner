import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../utils/supabase";
import { otherStyles } from "../../utils/otherStyles";

export default function Friends({ route, navigation }) {
  const userId = route?.params?.userId ?? null;
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchFriends = async () => {
      setLoading(true);
      try {
        // Get all accepted friendships involving the current user
        const { data: friendsData, error } = await supabase
          .from("friends")
          .select("id, sender_id, receiver_id")
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
          .eq("status", "accepted");

        if (error) throw error;

        // Extract the IDs of the *other* user in each friendship
        const friendIds = friendsData.map(f =>
          f.sender_id === userId ? f.receiver_id : f.sender_id
        );

        // Fetch profile info for all friends
        let friendsProfiles = [];
        if (friendIds.length > 0) {
          const { data: profilesData, error: profileError } = await supabase
            .from("profiles")
            .select("id, username, full_name")
            .in("id", friendIds);

          if (profileError) throw profileError;
          friendsProfiles = profilesData;
        }

        // Update state with fetched friend profiles
        setFriends(friendsProfiles);
      } catch (err) {
        console.error("Failed to fetch friends:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [userId]);

  // Render a single friend item (clickable to navigate to their profile)
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={otherStyles.listContainer}
      onPress={() => navigation.navigate("UserProfile", { userId: item.id })}
    >
      <Text style={otherStyles.username}>{item.username}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={otherStyles.safeArea}>
      <View style={otherStyles.container}>
        {/* Header with back button and title */}
        <View style={otherStyles.titleWithBackContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 10 }}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={otherStyles.title}>Friends</Text>
        </View>

        {/* Show loading / empty / list */}
        {loading ? (
          <Text style={{ marginTop: 20 }}>Loading friends...</Text>
        ) : friends.length === 0 ? (
          <Text style={{ marginTop: 20 }}>No friends yet</Text>
        ) : (
          <FlatList
            data={friends}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
} 
