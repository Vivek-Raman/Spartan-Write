import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function ErrorFatal() {
  const navigate = useNavigate();

  return (
    <div>
      <h1>Error</h1>
      <p>An error occurred.</p>
      <Button onClick={() => navigate("/dashboard")}>Go home</Button>
    </div>
  );
}
