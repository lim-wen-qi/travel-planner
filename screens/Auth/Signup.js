import React, { useState, useEffect } from "react";
import { View, TextInput, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { supabase } from "../../utils/supabase";
import { authStyles } from "../../utils/authStyles";

export default function Signup({ navigation }) {
  const [fullName, setFullName] = useState("");   // NEW state
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); 
  const [error, setError] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Check username availability
  useEffect(() => {
    if (!username) {
      setUsernameAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      setUsernameAvailable(!data);
      setCheckingUsername(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSignup = async () => {
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    // Username validation
    if (!username) {
      setError("Please enter a username.");
      return;
    }
    if (/\s/.test(username)) {
      setError("Username cannot contain spaces.");
      return;
    }
    if (!usernameAvailable) {
      setError("Username already taken. Please choose another.");
      return;
    }

    // Password validation
    if (!password || !confirmPassword) {
      setError("Please enter password and confirm it.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Signup in Supabase auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    const user = data.user;
    if (!user) {
      setError("Signup failed, no user returned.");
      return;
    }

    // Insert into profiles
    const { error: profileError } = await supabase
      .from("profiles")
      .insert([
        { id: user.id, 
        username: username.toLowerCase(), 
        full_name: fullName.trim(), 
        email: user.email }
      ]);

    if (profileError) {
      setError(profileError.message);
    } else {
      alert("Welcome! Your account has been created. Please log in to continue.");
      navigation.replace("Login");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={authStyles.container}
    >
      <Text style={authStyles.logo}>Travel Planner</Text>

      {/* Full Name Input */}
      <Text style={authStyles.label}>Full Name</Text>
      <TextInput
        value={fullName}
        onChangeText={setFullName}
        style={authStyles.input}
      />

      {/* Username Input */}
      <Text style={authStyles.label}>Username</Text>
      <TextInput
        value={username}
        onChangeText={(text) => {
          const cleanText = text.replace(/\s+/g, "").toLowerCase();
          setUsername(cleanText);
        }}
        style={authStyles.input}
        autoCapitalize="none"
      />
      {checkingUsername && <Text style={{ color: "gray" }}>Checking...</Text>}
      {username && usernameAvailable === false && (
        <Text style={{ color: "red" }}>Username is taken</Text>
      )}
      {username && usernameAvailable === true && (
        <Text style={{ color: "green" }}>Username is available</Text>
      )}

      {/* Email Input */}
      <Text style={authStyles.label}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        style={authStyles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Password Input */}
      <Text style={authStyles.label}>Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={authStyles.input}
      />

      {/* Confirm Password Input */}
      <Text style={authStyles.label}>Confirm Password</Text>
      <TextInput
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={authStyles.input}
      />

      {/* Error */}
      {error ? <Text style={authStyles.error}>{error}</Text> : null}

      {/* Signup Button */}
      <TouchableOpacity
        style={authStyles.button}
        onPress={handleSignup}
        disabled={checkingUsername || usernameAvailable === false}
      >
        <Text style={authStyles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      {/* Login Link */}
      <View style={authStyles.signupContainer}>
        <Text>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={authStyles.signupText}>Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
