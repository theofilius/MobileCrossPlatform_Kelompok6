import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    padding: 20,
  },

  card: {
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: "#1E1E2D",
    padding: 10,

    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },

  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },

  textContainer: {
    marginLeft: 16,
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 50,
  },

  boldText: {
    fontWeight: "bold",
    fontSize: 18,
    color: "white",
  },

  emailText: {
    color: "#ccc",
  },
});

export default styles;