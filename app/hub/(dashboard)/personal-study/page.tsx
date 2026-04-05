"use client";

import { useState } from "react";
import Header from "@/components/hub/hub-header";
import { StudyVideos } from "@/components/personal-study/study-videos";
import { StudyLibrary } from "@/components/personal-study/study-library";
import { useUnifiedSearch } from "@/hooks/use-unified-search";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PersonalStudyPage() {
  const [search, setSearch] = useState("");

  const { videos: searchVideos, publications: searchPubs, isSearching } = useUnifiedSearch(search);

  return (
    <div className="container-page overflow-hidden">
      <Header
        scrollSearch
        searchQuery={search}
        setSearchQuery={setSearch}
        showSearch={true}
      />

      <div className="hidden md:flex flex-col md:flex-row lg:flex-row mx-auto max-w-full overflow-hidden">
        <StudyVideos
          searchQuery={search}
          searchResults={searchVideos}
          isSearching={isSearching}
        />
        <StudyLibrary
          search={search}
          searchResults={searchPubs}
          isSearching={isSearching}
        />
      </div>

      <Tabs className="block md:hidden" defaultValue="videos">
        <TabsList className="min-w-full">
          <TabsTrigger value="videos">Vídeos</TabsTrigger>
          <TabsTrigger value="library">Biblioteca</TabsTrigger>
        </TabsList>
        <TabsContent value="videos">
          <StudyVideos
            searchQuery={search}
            searchResults={searchVideos}
            isSearching={isSearching}
          />
        </TabsContent>
        <TabsContent value="library">
          <StudyLibrary
            search={search}
            searchResults={searchPubs}
            isSearching={isSearching}
          />
        </TabsContent>
      </Tabs>

    </div>
  );
}