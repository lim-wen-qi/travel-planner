import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from "../utils/supabase";
import { otherStyles } from "../utils/otherStyles";

export default function Search({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      const { data: currentUser } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username")
        .neq("id", currentUser.user.id);

      if (!error) setUsers(data);
    };

    fetchUsers();
  }, []);

  // Filter users whenever searchQuery or users changes
  useEffect(() => {
    if (!searchQuery) {
      setFilteredUsers([]);
      return;
    }

    // Filter users by username
    const filtered = users.filter((u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  // Render each user in the FlatList
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={otherStyles.userItem}
      onPress={() => {
        // Navigate to UserProfile when clicked
        navigation.getParent()?.navigate("Profile", {
          screen: "UserProfile",
          params: { userId: item.id },
        });
      }}
    >
      <Text style={otherStyles.username}>{item.username}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={otherStyles.safeArea}>
      <View style={otherStyles.container}>
        {/* Search input */}
        <TextInput
          placeholder="Search username..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={otherStyles.input}
          placeholderTextColor="#999"
        />

        {/* Display filtered users or no results message */}
        {filteredUsers.length > 0 ? (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            style={{ marginTop: 10 }}
          />
        ) : (
          // Show "No users found" if query exists but no match
          searchQuery.length > 0 && <Text style={otherStyles.noResults}>No users found</Text>
        )}
      </View>
    </SafeAreaView>
  );
}
