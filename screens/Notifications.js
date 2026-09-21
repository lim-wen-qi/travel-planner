import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../utils/supabase";
import { otherStyles } from "../utils/otherStyles";
import { Ionicons } from "@expo/vector-icons";

export default function Notifications({ navigation }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch the current logged-in user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUser(data?.user ?? null);
    };
    getUser();
  }, []);

  // Fetch notifications when currentUser is available
  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        // Fetch notifications for the current user
        const { data, error } = await supabase
          .from("notifications")
          .select(`
            id,
            created_at,
            user_id,
            sender_id,
            type,
            message,
            read,
            sender:profiles!notifications_sender_id_fkey(username)
          `)
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setNotifications(data ?? []);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
        Alert.alert("Error", "Failed to fetch notifications");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [currentUser]);

  // Handle notification click: mark as read + navigate to profile
  const handlePress = async (item) => {
    try {
      // Mark notification as read in Supabase
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", item.id);

      if (error) throw error;

      // Update local state to reflect read status
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
      );

      // Navigate to sender's profile if sender_id exists
      if (item.sender_id) {
        navigation.navigate("Profile", { userId: item.sender_id });
      }
    } catch (err) {
      console.error("Failed to handle notification:", err);
      Alert.alert("Error", "Something went wrong");
    }
  };

  // Render each notification
  const renderItem = ({ item }) => {
    const senderName = item.sender?.username || "Someone";
    let titleBefore = "";
    let titleAfter = "";

    // Customize message based on notification type
    if (item.type === "friend_request") {
      titleAfter = " sent you a friend request";
    } else if (item.type === "friend_accept") {
      titleAfter = " accepted your friend request";
    } else if (item.type === "friend_reject") {
      titleAfter = " rejected your friend request";
    } else {
      titleAfter = item.message || "You have a notification";
    }

    return (
      <View
        style={[
          otherStyles.listContainer,
          { backgroundColor: item.read ? "#dbdbdb" : "#fff" },
        ]}
      >
        {/* Notification timestamp */}
        <Text style={otherStyles.notificationDate}>
          {new Date(item.created_at).toLocaleString()}
        </Text>

        {/* Notification message */}
        <Text style={otherStyles.notificationText}>
          {titleBefore}
          <Text
            style={{ fontWeight: "bold", color: "black" }}
            onPress={() => navigation.navigate("UserProfile", { userId: item.sender_id })}
          >
            {senderName}
          </Text>
          {titleAfter}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={otherStyles.safeArea}>
      <View style={otherStyles.container}>
        {/* Header with back button */}
        <View style={otherStyles.titleWithBackContainer}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ marginRight: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={otherStyles.title}>Notifications</Text>
        </View>

        {/* Loading indicator */}
        {loading ? (
          <Text style={{ marginTop: 20 }}>Loading notifications...</Text>
        ) : notifications.length === 0 ? (
          // Empty state
          <Text style={{ marginTop: 20 }}>No notifications yet</Text>
        ) : (
          // Notification list
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
