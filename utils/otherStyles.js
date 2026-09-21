import { StyleSheet } from "react-native";

export const otherStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { padding: 20 },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20
  },
  titleWithBackContainer:{ 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 20 
  },
  title: { fontSize: 24, fontWeight: "bold",  },
  label: { fontWeight: "bold", marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "white",
  },
  boldText: { fontSize: 18, fontWeight: "bold" },
  smallText: { fontSize: 14, color: "#666" },  
  userItem: {
    padding: 12,
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 10,
    elevation: 1,
  },
  username: {
    fontSize: 16,
    color: "#000",
  },
  noResults: { marginTop: 10, textAlign: "center", color: "#999" },
  profileEdit:{
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileInfo: {
    padding: 15,
    backgroundColor: "white",
    borderRadius: 8,
    elevation: 2,
  },
  friendsButton: {
    borderWidth: 1,
    borderColor: "black",
    marginVertical: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: "center",
   },
  friendsText: { color: "black", fontWeight: "bold" },
  button: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "white", fontWeight: "bold" },
  saveButton: {
    backgroundColor: "#1E90FF",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "black",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginVertical: 10 },
  friendItem: {
    padding: 10,
    backgroundColor: "white",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  listContainer: { 
    padding: 15,
    backgroundColor: 'white',
    marginBottom: 10,
    borderRadius: 8,
  },
  notificationText: { 
    color: "black", 
    fontSize: 18, 
  },
  notificationDate: { 
    color: "#525252", 
    fontSize: 14, 
    marginBottom: 8,
  },
});

