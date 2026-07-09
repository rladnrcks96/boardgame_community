"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function GameDetailTabs({
  wiki,
  review,
}: {
  wiki: React.ReactNode;
  review: React.ReactNode;
}) {
  return (
    <Tabs defaultValue="wiki" className="mt-4">
      <TabsList>
        <TabsTrigger value="wiki">위키</TabsTrigger>
        <TabsTrigger value="review">리뷰</TabsTrigger>
      </TabsList>
      <TabsContent value="wiki">{wiki}</TabsContent>
      <TabsContent value="review">{review}</TabsContent>
    </Tabs>
  );
}
