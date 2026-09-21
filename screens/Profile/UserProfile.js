import React, { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";
import { Ionicons } from "@expo/vector-icons";
import { otherStyles } from "../../utils/otherStyles";

export default function UserProfile({ route, navigation }) {
  const userId = route?.params?.userId;
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [friendsCount, setFriendsCount] = useState(0);
  const [friendStatus, setFriendStatus] = useState(null);

  // Get logged-in user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUser(data?.user ?? null);
    };
    getUser();
  }, []);

  // Fetch profile data, friends count, and friend status
  useFocusEffect(
    useCallback(() => {
      if (!currentUser || !userId) return;

      const fetchData = async () => {
        // Fetch user profile info
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, username, full_name, email")
          .eq("id", userId)
          .single();
        setProfile(profileData);

        // Fetch number of friends
        const count = await fetchFriendsCount(userId);
        setFriendsCount(count);

        // Fetch friendship status between currentUser and profile
        const status = await fetchFriendStatus(currentUser.id, userId);
        setFriendStatus(status);
      };

      fetchData();
    }, [currentUser, userId, fetchFriendStatus])
  );

  // Count how many friends a user has
  const fetchFriendsCount = async (profileId) => {
    const { count } = await supabase
      .from("friends")
      .select("*", { count: "exact" })
      .or(`sender_id.eq.${profileId},receiver_id.eq.${profileId}`)
      .eq("status", "accepted");
    return count ?? 0;
  };

  // Check relationship between two users
  const fetchFriendStatus = useCallback(async (userA, userB) => {
    const { data: friendData } = await supabase
      .from("friends")
      .select("*")
      .or(
        `and(sender_id.eq.${userA},receiver_id.eq.${userB}),and(sender_id.eq.${userB},receiver_id.eq.${userA})`
      );

    if (!friendData || friendData.length === 0) return "none";

    const rel = friendData[0];
    if (rel.status === "accepted") return "accepted";
    else if (rel.sender_id === currentUser.id) return "pending_sent";
    else return "pending_received";
  }, [currentUser]);

  // Send a new friend request
  const sendFriendRequest = async () => {
    if (!currentUser || !profile) return;

    // Insert new friend request
    const { error } = await supabase.from("friends").insert([
      { sender_id: currentUser.id, receiver_id: profile.id }
    ]);
    if (error) return Alert.alert("Error", "Failed to send friend request");

    // Insert notification for receiver
    await supabase.from("notifications").insert([
      { user_id: profile.id, sender_id: currentUser.id, type: "friend_request", read: false }
    ]);

    // Refresh state after sending request
    const status = await fetchFriendStatus(currentUser.id, profile.id);
    setFriendStatus(status);
    const count = await fetchFriendsCount(profile.id);
    setFriendsCount(count);

    Alert.alert("Friend request sent!");
  };

  return (
    <SafeAreaView style={otherStyles.safeArea}>
      <View style={otherStyles.container}>
        {/* Header with back button */}
        <View style={otherStyles.titleWithBackContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 10 }}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={otherStyles.title}>{profile?.username || "Profile"}</Text>
        </View>

        {/* Profile info */}
        {profile ? (
          <>
            <View style={otherStyles.profileInfo}>
              <Text style={otherStyles.boldText}>{profile.full_name}</Text>
              <Text style={otherStyles.smallText}>{profile.email}</Text>
            </View>

            {/* Friends count */}
            <TouchableOpacity
              style={otherStyles.friendsButton}
              onPress={() => navigation.navigate("Friends", { userId: profile.id })}
            >
              <Text style={otherStyles.friendsText}>{friendsCount} Friends</Text>
            </TouchableOpacity>

            {/* Friend action buttons */}
            <View style={{ marginTop: 12 }}>
              {friendStatus === "none" && (
                <TouchableOpacity style={otherStyles.button} onPress={sendFriendRequest}>
                  <Text style={otherStyles.buttonText}>Add Friend</Text>
                </TouchableOpacity>
              )}
              {friendStatus === "pending_sent" && (
                <TouchableOpacity style={otherStyles.button} disabled>
                  <Text style={otherStyles.buttonText}>Pending</Text>
                </TouchableOpacity>
              )}
              {friendStatus === "accepted" && (
                <TouchableOpacity style={otherStyles.button} disabled>
                  <Text style={otherStyles.buttonText}>Friends ✓</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        ) : (
          // Loading state while fetching profile
          <Text>Loading...</Text>
        )}
      </View>
    </SafeAreaView>
  );
}
