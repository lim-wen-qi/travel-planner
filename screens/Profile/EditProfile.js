import React, { useState, useEffect } from "react";
import { View, TextInput, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../utils/supabase";
import { otherStyles } from "../../utils/otherStyles";

export default function EditProfile({ route, navigation }) {
  const { userId } = route.params;
  // Profile state
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  // Feedback state
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // Auth-related state
  const [email, setEmail] = useState(""); 
  // Full name state
  const [fullName, setFullName] = useState("");
  const [originalFullName, setOriginalFullName] = useState("");
  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      // Get current user (for email)
      const { data: { user } } = await supabase.auth.getUser();

      // Get profile info (username + full name)
      const { data } = await supabase
        .from("profiles")
        .select("username, full_name")
        .eq("id", userId)
        .single();

      // Set initial states
      if (data) {
        setUsername(data.username);
        setOriginalUsername(data.username);
        setFullName(data.full_name || "");
        setOriginalFullName(data.full_name || "");
      }

      if (user) {
        setEmail(user.email);
      }
    };
    fetchProfile();
  }, [userId]);

  // Check username availability
  useEffect(() => {
    // If no username or unchanged → skip
    if (!username || username === originalUsername) {
      setUsernameAvailable(null);
      return;
    }

    const checkUsername = async () => {
      setCheckingUsername(true);

      // Query profiles for same username
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .single();

      // Username is available if no data found
      setUsernameAvailable(!data);
      setCheckingUsername(false);
    };

    const delay = setTimeout(checkUsername, 500);
    return () => clearTimeout(delay);
  }, [username, originalUsername]);

  // Save changes handler
  const handleSave = async () => {
    setError("");
    setSuccess("");

    // Validate username
    if (!username) {
      setError("Please enter a username.");
      return;
    }
    if (/\s/.test(username)) {
      setError("Username cannot contain spaces.");
      return;
    }
    if (username !== originalUsername && !usernameAvailable) {
      setError("Username already taken. Please choose another.");
      return;
    }

    // Update profiles table
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        username: username.toLowerCase(),
        full_name: fullName.trim(),
      })
      .eq("id", userId);

    if (profileError) {
      setError(profileError.message);
      return;
    }

    // Update password
    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      const { error: pwError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (pwError) {
        setError(pwError.message);
        return;
      }
    }

    // Show success message and reset form
    setSuccess("Profile updated successfully!");
    setNewPassword("");
    setConfirmPassword("");
    navigation.goBack();
  };

  return (
    <SafeAreaView style={otherStyles.safeArea}>
      <View style={otherStyles.container}>
        {/* Header with back button */}
        <View style={otherStyles.titleWithBackContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 10 }}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={otherStyles.title}>Edit Profile</Text>
        </View>

        {/* Full Name input */}
        <Text style={otherStyles.label}>Full Name</Text>
        <TextInput
          style={otherStyles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter your full name"
        />

        {/* Username input + availability check */}
        <Text style={otherStyles.label}>Username</Text>
        <TextInput
          style={otherStyles.input}
          value={username}
          onChangeText={(text) => {
            const cleanText = text.replace(/\s+/g, "").toLowerCase(); // remove spaces + lowercase
            setUsername(cleanText);
          }}
          placeholder="Username"
        />
        {checkingUsername && <Text style={{ color: "gray" }}>Checking...</Text>}
        {username && username !== originalUsername && usernameAvailable === false && (
          <Text style={{ color: "red" }}>Username is taken</Text>
        )}
        {username && username !== originalUsername && usernameAvailable === true && (
          <Text style={{ color: "green" }}>Username is available</Text>
        )}

        {/* Email (read-only) */}
        <Text style={otherStyles.label}>Email</Text>
        <TextInput
          value={email}
          editable={false}
          style={[otherStyles.input, { backgroundColor: "#e0e0e0" }]}
        />

        {/* Change Password inputs */}
        <Text style={otherStyles.label}>New Password</Text>
        <TextInput
          style={otherStyles.input} 
          value={newPassword} 
          onChangeText={setNewPassword} 
          placeholder="Enter new password" 
          secureTextEntry 
        />

        <Text style={otherStyles.label}>Confirm Password</Text>
        <TextInput
          style={otherStyles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm password"
          secureTextEntry
        />

        {/* Error / Success messages */}
        {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
        {success ? <Text style={{ color: "green" }}>{success}</Text> : null}

        {/* Save button */}
        <TouchableOpacity
          style={otherStyles.saveButton}
          onPress={handleSave}
        >
          <Text style={otherStyles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
