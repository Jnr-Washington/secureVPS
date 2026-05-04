import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Footer } from "@/components/layout/footer";

export function Signup(){
    return(
        <div>
            <div>
                <h1 className="text-2xl font-bold mb-4">Create an Account</h1>
                <p className="mb-6 text-gray-600">Sign up to get started with our services.</p>
                <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
                    <FieldGroup>
                        <FieldLabel htmlFor="name">Name</FieldLabel>
                        <Input id="name" placeholder="John Doe" />
                    </FieldGroup>
                    <FieldGroup>
                        <FieldLabel htmlFor="email">Email</FieldLabel>
                        <Input id="email" type="email" placeholder="john@example.com" />
                    </FieldGroup>
                    <FieldGroup>
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                        <Input id="password" type="password" placeholder="••••••••" />
                    </FieldGroup>
                    <FieldGroup>
                        <FieldLabel htmlFor="password">Confirm Password</FieldLabel>
                        <Input id="password" type="password" placeholder="••••••••" />
                    </FieldGroup>
                    <Button className="w-full mt-6">Sign Up</Button>
                </div>
            </div>
        </div>
    );
};
export function SignupPage(){
    return(
        <>
            <Signup />
            <Footer />
        </>
    );
};