import { Redirect } from "expo-router";

// Placeholder route for the centre tab; pressing it opens the booking flow instead.
export default function BookTab() {
  return <Redirect href="/book" />;
}
