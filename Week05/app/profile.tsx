import { Link, useLocalSearchParams } from "expo-router";
import { Button, Text, View } from "react-native";
import { Avatar } from "react-native-paper";

export default function Profile() {

  const { userName, email, photo } = useLocalSearchParams<{
    userName: string;
    email: string;
    photo: string;
  }>();

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <Avatar.Image size={120} source={{ uri: photo }} />

      <Text style={{ fontSize: 20, marginTop: 15 }}>
        {userName}'s Profile
      </Text>

      <Text style={{ marginBottom: 20 }}>{email}</Text>

      <Link href="/home" push asChild>
        <Button title="Go to Home Screen" />
      </Link>
    </View>
  );
}