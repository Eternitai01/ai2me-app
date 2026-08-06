import { CheckCircle } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { LineComponent } from "./line-component";
import { useState } from "react";

export function Newsletter() {
      const [isSubscribed, setIsSubscribed] = useState(false);
      const [email, setEmail] = useState("");
       const handleSubscribe = (e: React.FormEvent) => {
          e.preventDefault();
          setIsSubscribed(true);
          setEmail("");
        };
  return (
    <>
     <section className="w-full flex justify-center  pb-12 md:pb-20 pt-10 md:pt-20 relative">
        <div className="w-full max-w-7xl px-4 md:px-4 lg:px-6 relative z-10">
          <div
            className="w-full rounded-2xl py-20 text-center px-6"
            style={{
              backgroundImage: `url(/images/borderTesture.png), radial-gradient(ellipse at center, #004EFD 20%, #0033AF 80%)`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <h2 className="text-[32px] md:text-[48px] font-bold text-white mb-4 leading-[38px] md:leading-[48px]">
              Subscribe to Status Updates
            </h2>

            <p className="text-white/80 max-w-2xl mx-auto mb-6 text-base font-normal md:text-lg">
              Get notified about system status changes and maintenance windows
            </p>

            <div className="max-w-[400px] mx-auto">
              {isSubscribed ? (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span>Thank you for subscribing to status updates!</span>
                </div>
              ) : (
                <form
                  onSubmit={handleSubscribe}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 bg-[#004EFD] h-12 px-5 border-1 border-[#687DFF] text-[#F7F8F9] placeholder:text-[#F7F8F9] rounded-full"
                  />
                  <Button variant={"default"} type="submit" className="h-12 px-6">Subscribe</Button>
                </form>
              )}
              <p className="text-xs text-white mt-4">
                Updates sent to team@ai2me.com • Unsubscribe anytime
              </p>
            </div>
          </div>
        </div>
        <LineComponent />
      </section>
    </>
  )
}