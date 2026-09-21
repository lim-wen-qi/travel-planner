import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

// Tabs
import Trips from "../screens/Trips/Trips";
import Search from "../screens/Search";
import Messages from "../screens/Messages";
import Profile from "../screens/Profile/Profile";

// Extra screens
import EditProfile from "../screens/Profile/EditProfile";
import UserProfile from "../screens/Profile/UserProfile";
import Friends from "../screens/Profile/Friends";
import CreateTrip from "../screens/Trips/CreateTrip";
import TripDetails from "../screens/Trips/TripDetails";
import Overview from "../screens/Trips/Overview";
import Itinerary from "../screens/Trips/Itinerary";
import Expenses from "../screens/Trips/Expenses";
import Members from "../screens/Trips/Members";
import Notifications from "../screens/Notifications";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/* --- Stacks for each tab --- */
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={Home} />
    </Stack.Navigator>
  );
}

function TripsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TripsMain" component={Trips} />
      <Stack.Screen name="CreateTrip" component={CreateTrip} />
      <Stack.Screen name="TripDetails" component={TripDetails} />
      <Stack.Screen name="Overview" component={Overview} />
      <Stack.Screen name="Itinerary" component={Itinerary} />
      <Stack.Screen name="Expenses" component={Expenses} />
      <Stack.Screen name="Members" component={Members} />
      <Stack.Screen name="Notifications" component={Notifications} />
    </Stack.Navigator>
  );
}

function SearchStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SearchMain" component={Search} />
    </Stack.Navigator>
  );
}

function MessagesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MessagesMain" component={Messages} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={Profile} />
      <Stack.Screen name="EditProfile" component={EditProfile} />
      <Stack.Screen name="UserProfile" component={UserProfile} />
      <Stack.Screen name="Friends" component={Friends} />
    </Stack.Navigator>
  );
}

/* --- Bottom Tabs --- */
export default function BottomTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Trips"
        component={TripsStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="airplane" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
