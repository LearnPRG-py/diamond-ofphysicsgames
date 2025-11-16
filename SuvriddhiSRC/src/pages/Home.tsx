import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import Header from "../components/home/header";
import Subjectselector from "../components/home/subjectselector";
import MenuCards from "../components/home/menucards";
import RecentActivity from "../components/home/recentactivity";
import type { Topic } from "../types/learningitems";

export default function Home() {
  const { subject, setSubject, lastActivity, setLastActivity, markItemCompleted, isItemCompleted } = useStore();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [hydrated, setHydrated] = useState(false); 

  useEffect(() => {
    fetch(`/data/learn/topics.json`)
      .then((r) => r.json())
      .then((t: Topic[]) => setTopics(t))
      .catch(() => setTopics([]))
      .finally(() => setHydrated(true)); 
  }, []);

  useEffect(() => {
    if (lastActivity) {
      localStorage.setItem("lastActivity", JSON.stringify(lastActivity));
    }
  }, [lastActivity]);

  useEffect(() => {
    const savedCompletedItems = localStorage.getItem("completedItems");
    if (savedCompletedItems) {
      const completedItems: { topicId: string; itemId: string }[] = JSON.parse(savedCompletedItems);
      completedItems.forEach((item) => {
        if (!isItemCompleted(item.itemId)) markItemCompleted(item.itemId);
      });
    }

    const savedLast = localStorage.getItem("lastActivity");
    if (savedLast && !lastActivity) {
      setLastActivity(JSON.parse(savedLast));
    }

    setHydrated(true);
  }, [lastActivity, markItemCompleted, isItemCompleted, setLastActivity]);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center font-display text-foreground bg-background">
        Loading...
      </div>
    );
  }

  if (lastActivity) {
    return (
      <div className={`min-h-screen bg-background flex flex-col text-foreground font-display theme-${subject}`}>
        <Header />
        <div className="mx-auto grow flex flex-col max-w-7xl py-12 px-8">
          <section>
            <h1 className="text-4xl font-bold tracking-tight text-balance">Welcome back!</h1>
            <p className="mt-4 text-lg text-muted-foreground">Select Your Subject</p>
            <Subjectselector newUser={false} subject={subject} setSubject={setSubject} />
          </section>
          <div className="flex flex-col grow justify-center mt-12 space-y-16">
            <section>
              <h2 className="mb-6 text-2xl font-semibold">Main Menu</h2>
              <MenuCards />
            </section>
            <section>
              <RecentActivity lastActivity={lastActivity!} />
            </section>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className={`min-h-screen bg-background flex flex-col text-foreground font-display theme-${subject}`}>
        <Header />
        <div className="mx-auto grow flex flex-col items-center justify-center max-w-7xl py-16 px-8">
          <section className="text-center">
            <h1 className="text-6xl font-bold tracking-tight text-balance mb-8">
              Welcome to SuvriddhiOS!
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Choose your subject to get started
            </p>
            <Subjectselector newUser={true} subject={subject} setSubject={setSubject} />
          </section>

          <section className="mt-32">
            <MenuCards />
          </section>
        </div>
      </div>
    );
  }
}