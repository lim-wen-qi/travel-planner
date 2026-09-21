import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";
import { Ionicons } from "@expo/vector-icons";
import { otherStyles } from "../../utils/otherStyles";

export default function Profile({ navigation }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [friendsCount, setFriendsCount] = useState(0);

  // Get logged-in user and profile info when screen loads
  useEffect(() => {
    const fetchProfile = async () => {
      // Get currently authenticated user
      const { data } = await supabase.auth.getUser();
      const user = data?.user ?? null;
      setCurrentUser(user);

      if (user) {
        // Fetch profile details from "profiles" table
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, username, full_name, email")
          .eq("id", user.id)
          .single();
        setProfile(profileData);

        // Fetch number of accepted friends
        const { count } = await supabase
          .from("friends")
          .select("*", { count: "exact" })
          .or(`sender_id.eq.${profileData.id},receiver_id.eq.${profileData.id}`)
          .eq("status", "accepted");

        setFriendsCount(count ?? 0);
      }
    };
    fetchProfile();
  }, []);

  // Logout function with confirmation alert
  const handleLogout = () => {
    Alert.alert("Confirm Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          navigation.replace("Login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={otherStyles.safeArea}>
      <View style={otherStyles.container}>
        {/* Title bar with username and logout button */}
        <View style={otherStyles.titleContainer}>
          <Text style={otherStyles.title}>{profile?.username || "Profile"}</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={28} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        {/* Show profile info if loaded, otherwise show loading text */}
        {profile ? (
          <View>
            {/* User profile details */}
            <View style={otherStyles.profileInfo}>
              <Text style={otherStyles.boldText}>{profile.full_name}</Text>
              <Text style={otherStyles.smallText}>{profile.email}</Text>

              {/* Navigate to Edit Profile screen */}
              <TouchableOpacity
                style={otherStyles.button}
                onPress={() => navigation.navigate("EditProfile", { userId: currentUser.id })}
              >
                <Text style={otherStyles.buttonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>

            {/* Navigate to Friends screen */}
            <TouchableOpacity
              style={otherStyles.friendsButton}
              onPress={() => navigation.navigate("Friends", { userId: profile.id })}
            >
              <Text style={otherStyles.friendsText}>{friendsCount} Friends</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text>Loading...</Text>
        )}
      </View>
    </SafeAreaView>
  );
}
