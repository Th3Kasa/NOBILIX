import { Gamepad2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Card className="border-border/60 shadow-xl backdrop-blur">
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Gamepad2 className="size-6" />
        </div>
        <CardTitle className="text-xl">NOBILIX Admin Console</CardTitle>
        <CardDescription>
          Secure sign-in for TrapMan administrators
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
