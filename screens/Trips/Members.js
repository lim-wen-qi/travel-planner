import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../utils/supabase";
import { tripStyles } from "../../utils/tripStyles";
import BottomSheet from "../../components/BottomSheet";

export default function Members({ route, navigation }) {
  const tripId = route?.params?.tripId;
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  // Fetch members of the trip
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("members")
      .select("id, user_id, is_admin, profiles(id, username, full_name)")
      .eq("trip_id", tripId);

    if (error) {
      console.error("Error fetching members:", error.message);
    } else {
      setMembers(data || []);
    }
    setLoading(false);
  }, [tripId]);

  // Check if current user is admin
  const checkIfAdmin = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("members")
      .select("is_admin")
      .eq("trip_id", tripId)
      .eq("user_id", user.id)
      .single();

    if (!error && data) {
      setIsAdmin(data.is_admin);
    }
  }, [tripId]);

  // Run fetchMembers and checkIfAdmin
  useEffect(() => {
    fetchMembers();
    checkIfAdmin();
  }, [fetchMembers, checkIfAdmin]);

  // Remove member (admin only)
  const removeMember = async (memberId) => {
    Alert.alert("Remove Member", "Are you sure you want to remove this member?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("members").delete().eq("id", memberId);
          if (error) {
            console.error("Error removing member:", error.message);
          } else {
            fetchMembers();
          }
        },
      },
    ]);
  };

  // Make a member admin
  const makeAdmin = async (memberId) => {
    const { error } = await supabase
      .from("members")
      .update({ is_admin: true })
      .eq("id", memberId);
    if (error) {
      console.error("Error making admin:", error.message);
    } else {
      fetchMembers();
    }
  };

  // Add member from friends list
  const addMember = async (friend) => {
    const { error } = await supabase.from("members").insert({
      trip_id: tripId,
      user_id: friend.id,
      is_admin: false,
    });

    if (error) {
      console.error("Error adding member:", error.message);
    } else {
      setShowAddModal(false);
      fetchMembers();
    }
  };

  // Fetch friends to add (replace with your own query if needed)
  const fetchFriends = async () => {
    const { data, error } = await supabase.from("profiles").select("id, username, full_name");
    if (!error) {
      setFriends(data || []);
    }
  };

  return (
    <View style={[tripStyles.container, { flex: 1 }]}>
      {/* Header with Add button for admins */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Text style={tripStyles.title}>Members</Text>
        {isAdmin && (
          <TouchableOpacity onPress={() => { fetchFriends(); setShowAddModal(true); }}>
            <Ionicons name="person-add" size={20} color="black" />
          </TouchableOpacity>
        )}
      </View>

      {/* Loading indicator */}
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        /* List of members */
        <FlatList
          data={members}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={tripStyles.listContainer}
              onPress={() => {
                setSelectedMember(item);
                setShowOptionsModal(true);
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>
                  {item.profiles?.username}
                </Text>
                {item.is_admin && <Text style={{ color: "grey" }}>Admin</Text>}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Options Modal for selected member */}
      <BottomSheet
        visible={showOptionsModal}
        onClose={() => setShowOptionsModal(false)}
        options={[
          {
            label: "View Profile",
            onPress: () =>
              navigation.navigate("UserProfile", { userId: selectedMember?.user_id }),
          },
          ...(isAdmin
            ? [
                !selectedMember?.is_admin && {
                  label: "Make Admin",
                  onPress: () => makeAdmin(selectedMember.id),
                },
                {
                  label: "Remove from Trip",
                  destructive: true,
                  onPress: () => removeMember(selectedMember.id),
                },
              ].filter(Boolean)
            : []),
        ]}
      />

      {/* Add Member Modal */}
      <Modal visible={showAddModal} animationType="slide">
        <View style={{ flex: 1, padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>Add Member</Text>

          {/* List of friends to add */}
          <FlatList
            data={friends}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{
                  padding: 12,
                  borderBottomWidth: 1,
                  borderColor: "#eee",
                }}
                onPress={() => addMember(item)}
              >
                <Text>{item.full_name || item.username}</Text>
              </TouchableOpacity>
            )}
          />

          {/* Close modal button */}
          <TouchableOpacity
            onPress={() => setShowAddModal(false)}
            style={{
              marginTop: 20,
              padding: 12,
              backgroundColor: "#ccc",
              alignItems: "center",
              borderRadius: 8,
            }}
          >
            <Text>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}
