import React, { useState } from "react";
import { View, TextInput, Text, Image, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { supabase } from "../../utils/supabase";
import { authStyles } from "../../utils/authStyles";

export default function Login({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    else navigation.replace("Main");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={authStyles.container}
    >
      {/* Logo */}
      <Text style={authStyles.logo}>Travel Planner</Text>

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

      {/* Error Message */}
      {error ? <Text style={authStyles.error}>{error}</Text> : null}

      {/* Login Button */}
      <TouchableOpacity
        style={authStyles.button}
        onPress={() => {
          handleLogin();
        }}
      >
  <Text style={authStyles.buttonText}>Login</Text>
</TouchableOpacity>

      {/* Sign Up Link */}
      <View style={authStyles.signupContainer}>
        <Text>Don't have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
          <Text style={authStyles.signupText}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
