import Image from "next/image";
import { Button } from "../ui/button";
import { BarChartBig, CreditCard, Shuffle } from "lucide-react";
import { LineComponent } from "../organisms/line-component";
import Link from "next/link";

export function ProductPreview() {
  const features = [
    {
      id: 1,
      icon: BarChartBig,
      title: "Real-Time Usage Dashboard",
      description:
        "Monitor live API calls, latency (P50/P95/P99), and error rates with full visibility into performance.",
      points: [
        "Track latency (P50/P95/P99) and error rates in real time.",
        "Track latency (P50/P95/P99) and error rates in real time.",
      ],
      button: "View Dashboard ",
      image: "/images/realtime-usage.png",
    },
    {
      id: 2,
      icon: CreditCard,
      title: "Credit Management",
      description:
        "Track prepaid balances, receive smart alerts, and forecast usage in real time.",
      points: [
        "Track prepaid credits and monitor spending in real time.",
        "Receive smart alerts to avoid balance drops or interruptions.",
      ],
      button: "Explore Billing",
      image: "/images/credit-management.png",
    },
    {
      id: 3,
      icon: Shuffle,
      title: "Cost Optimization Router",
      description:
        "Compare AI providers and auto-route queries to the most cost-effective model while maintaining SLAs.",
      points: [
        "Compare providers to find the most cost-effective option.",
        "Automatically route queries without compromising quality.",
      ],
      button: "See Router in Action",
      image: "/images/cost-optimization.png",
    },
  ];

  return (
    <section className="py-8 md:py-20 bg-[#F9FAFB] relative">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        {/* Top Heading */}
        <div className="max-w-[807px] mx-auto mb-16">
          <p className="text-center text-[16px] font-semibold text-[#0033AF] mb-4">
            Product Preview
          </p>
          <h1 className="text-center text-[32px] md:text-[48px] font-bold mb-5 text-[#121416]">
            See AI2me in Action
          </h1>
          <p className="text-center text-[#626970]">
            Get a closer look at how AI2me simplifies AI management from
            dashboards to cost optimization and credit tracking.
          </p>
        </div>

        {/* Layout */}
        <div className="space-y-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="grid md:grid-cols-2 gap-6 md:gap-30 items-center"
            >
              {/* Image section - always on the left */}
              <div className="relative rounded-[16px] px-6 pt-6 pb-0 overflow-hidden shadow-[0px_4px_12px_1px_#dfdfdf] h-full">
                <Image
                  src={feature.image}
                  alt={feature.title}
                  height={300}
                  width={600}
                  className="!w-full !h-auto rounded-t-[16px]"
                  // sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>

              {/* Content section - always on the right */}
              <div key={feature.id} className="flex items-start space-x-4">
                <div>
                  <div className="bg-white p-3 rounded-lg shadow-[0px_2px_4px_0px_#3232470F] mb-5 w-fit">
                    <feature.icon className="w-6 h-6 text-[#0033AF]" />
                  </div>
                  <h3 className={`text-2xl font-semibold text-[#121416]`}>
                    {feature.title}
                  </h3>
                  <p className="text-base font-normal text-[#626970] mt-3">
                    {feature.description}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {feature.points.map((point, i) => (
                      <li
                        key={i}
                        className="flex items-center text-sm font-normal text-[#626970]"
                      >
                        <Image
                          src={"/images/checkCircle.png"}
                          height={18}
                          width={18}
                          className="mr-2"
                          alt=""
                        />{" "}
                        {point}
                      </li>
                    ))}
                  </ul>
                  <Link href={"/"}>
                    <Button
                      className="mt-8 cursor-pointer"
                      variant={"outlineBlack"}
                    >
                      {feature.button}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <LineComponent />
    </section>
  );
}

