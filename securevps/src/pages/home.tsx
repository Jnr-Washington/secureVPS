import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Server, Database, AlertTriangle, ShieldCheck } from "lucide-react";


import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Footer } from "@/components/layout/footer";
import { useNavigate } from "react-router-dom";

// Re-populated constants with descriptive content
const PLATFORM_OVERVIEW = [
  {
    icon: Server,
    accent: 'text-emerald-800 dark:text-emerald-600',
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    title: "Orchestrate.",
    description: "Multi-cloud infrastructure as code. Automated VPS deployment with standard tools.",
  },
  {
    icon: ShieldCheck,
    accent: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    title: "Harden.",
    description: "Industry-standard CIS benchmark hardening for secure and compliant servers.",
  },
  {
    icon: AlertTriangle,
    accent: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    title: "Scan.",
    description: "Continuous and deep vulnerability scanning across your hybrid fleet.",
  },
  {
    icon: Database,
    accent: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-100 dark:bg-teal-900/30",
    title: "Report.",
    description: "AI-powered security insights and predictive prioritization of risks.",
  }
];

function PlatformOverviewCard({
    icon: Icon,
    accent,
    bg,
    title,
    description
}: {
    icon: React.ElementType;
    accent: string;
    bg: string;
    title: string;
    description: string;
}){
    return(
        <div className="h-full bg-white/75 dark:bg-gray-900/75 backdrop-blur-xl rounded-[28px] border border-white/60 dark:border-gray-800/60 p-6 shadow-lg shadow-emerald-900/5">
          <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center mb-5 shadow-sm`}>
            <Icon className={`w-7 h-7 ${accent}`} />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3 leading-tight">
            {title}
          </h3>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed">
            {description}
          </p>
        </div>
    );
};

// Fixed variable name: PLATFORM_STEPS -> PLATFORM_OVERVIEW
function PlatformOverviewSection(){
    return(
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-8">
            <div className="relative p-6 sm:p-8 lg:p-10">
                <div className="hidden lg:grid lg:grid-cols-4 gap-6">
                    {
                        PLATFORM_OVERVIEW.map((step)=>(
                            <PlatformOverviewCard key={step.title} {...step}/>
                        ))
                    }
                </div>

                <div className="lg:hidden px-1">
                    <Carousel
                      opts={{ align: "start", loop: false }}
                      className="w-full"
                    >
                      <CarouselContent className="-ml-3">
                        {PLATFORM_OVERVIEW.map((step) => ( 
                          <CarouselItem key={step.title} className="pl-3 basis-[88%] sm:basis-[60%]">
                            <PlatformOverviewCard {...step} />
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <div className="flex items-center justify-between mt-5 px-2">
                        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-gray-400">
                          Swipe to explore
                        </p>
                        <div className="flex items-center gap-2">
                          <CarouselPrevious className="static translate-y-0 size-10 border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 text-gray-700 dark:text-gray-200 disabled:opacity-40" />
                          <CarouselNext className="static translate-y-0 size-10 border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 text-gray-700 dark:text-gray-200 disabled:opacity-40" />
                        </div>
                      </div>
                    </Carousel>
                </div>
            </div>
        </section>
    );
};

function Home(){
  const navigate = useNavigate();
  const handleTrialClick = () => navigate("/user-dashboard");
    return(
        <>
            <Navbar/>
            
            {/* The new hero section based on image_0.png */}
            <main className="min-h-screen bg-gray-100 text-gray-600 px-8 py-16">
                <section className="grid grid-cols-1 md:grid-cols-[1fr,400px] gap-12 items-center mb-24">
                    <div>
                        <h1 className="text-6xl font-extrabold leading-tight tracking-tight max-w-3xl">
                            Orchestrate, Harden,<br/> and Scan. Securely.
                        </h1>
                        <p className="mt-8 text-2xl font-medium text-gray-600 max-w-2xl">
                            The web-based SaaS for Automated VPS Deployment, Vulnerability Scanning, and AI-Powered Security Reporting.
                        </p>
                        <div className="mt-12 flex gap-6">
                            <Button size="lg" className="bg-emerald-800 text-white hover:bg-emerald-900" onClick={handleTrialClick}>
                                Start Free Trial
                            </Button>
                            <Button size="lg" variant="outline" className="border-emerald text-gray-600 hover:bg-emerald-500">
                                Schedule a Demo
                            </Button>
                        </div>
                    </div>
                    
                    {/* Placeholder for the right-side diagram */}
                    <div className="flex items-center justify-center">
                    </div>
                </section>
                
                {/* Integration sections below the hero */}
                <section className="mb-16">
                    <h2 className="text-4xl font-bold mb-12">Integrations</h2>
                </section>

                <PlatformOverviewSection />
            </main>
            
        </>
    );
};

export function HomePage(){
    return(
        <>
        <Home/>
        <Footer/>
        </>
    );
};