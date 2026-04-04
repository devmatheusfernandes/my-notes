"use client";

import { useState } from "react";
import Header from "@/components/hub/hub-header";
import { StudyVideos } from "@/components/personal-study/study-videos";
import { StudyLibrary } from "@/components/personal-study/study-library";
import { useUnifiedSearch } from "@/hooks/use-unified-search";

export default function PersonalStudyPage() {
  const [search, setSearch] = useState("");

  const { videos: searchVideos, publications: searchPubs, isSearching } = useUnifiedSearch(search);

  return (
    <div className="container-page overflow-y-hidden max-h-[100vh]">
      <Header
        scrollSearch
        searchQuery={search}
        setSearchQuery={setSearch}
        showSearch={true}
      />

      <div className="flex flex-col md:flex-row lg:flex-row mx-auto max-w-[95vw]">
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
    </div>
  );
}