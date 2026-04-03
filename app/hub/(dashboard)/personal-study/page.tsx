"use client";

import { useState } from "react";
import Header from "@/components/hub/hub-header";
import { StudyVideos } from "./study-videos";
import { StudyLibrary } from "./study-library";

export default function PersonalStudyPage() {
  const [search, setSearch] = useState("");

  return (
    <div className="container-page">
      <Header
        scrollSearch
        searchQuery={search}
        setSearchQuery={setSearch}
        showSearch={true}
      />

      <div className="flex flex-col md:flex-row lg:flex-row mx-auto px-8">
        <StudyVideos />
        <StudyLibrary search={search} />
      </div>
    </div>
  );
}