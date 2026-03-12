import { Link } from "expo-router";
import { Button, Text, View } from "react-native";

export default function Home() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ marginBottom: 20 }}>Navigation List</Text>

      <Link href="/email" push asChild>
        <Button title="Go to Email Screen" />
      </Link>

      <View style={{ marginTop: 10 }} />

      <Link href="/userList" push asChild>
        <Button title="Go to User List Page" />
      </Link>
    </View>
  );
}