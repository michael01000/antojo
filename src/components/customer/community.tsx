"use client";

import { useState } from "react";
import { usePostsFeed, useLikePost, useToggleFollow, useStories, useMarkStoryViewed } from "@/hooks/use-data";
import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ShoppingBag, UserPlus, UserCheck, Flame, Users, X, ChevronRight } from "lucide-react";
import { cop, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export function Community() {
  const [tab, setTab] = useState<"following" | "explore">("following");
  const { data, isLoading } = usePostsFeed(tab);
  const { data: storiesData } = useStories();
  const posts = data?.posts ?? [];

  return (
    <div className="px-3 pt-4 pb-6 sm:px-5 lg:px-0 lg:max-w-2xl lg:mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight">
          <Users size={22} style={{ color: "var(--antojo)" }} /> Comunidad
        </h1>
      </div>

      {/* Stories bar */}
      {storiesData?.groups?.length > 0 && <StoriesBar groups={storiesData.groups} />}

      {/* Tabs */}
      <div className="mb-4 flex rounded-xl bg-secondary p-1">
        <button onClick={() => setTab("following")} className={cn("flex-1 rounded-lg py-2 text-sm font-semibold transition", tab === "following" ? "bg-card shadow-soft" : "text-muted-foreground")}>Siguiendo</button>
        <button onClick={() => setTab("explore")} className={cn("flex-1 rounded-lg py-2 text-sm font-semibold transition", tab === "explore" ? "bg-card shadow-soft" : "text-muted-foreground")}>Explorar</button>
      </div>

      {/* Feed */}
      {isLoading ? (
        <div className="space-y-4">{[0,1,2].map(i => <Skeleton key={i} className="h-96 rounded-3xl" />)}</div>
      ) : posts.length === 0 ? (
        <Card className="p-10 text-center">
          <Users size={32} className="mx-auto mb-2 text-muted-foreground" />
          <p className="font-semibold">Aún no hay posts</p>
          <p className="text-sm text-muted-foreground">¡Sigue a restaurantes para ver sus publicaciones aquí!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post: any) => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  );
}

function PostCard({ post }: { post: any }) {
  const likeMut = useLikePost();
  const followMut = useToggleFollow();
  const addToCart = useApp((s) => s.addToCart);
  const setSelectedRestaurant = useApp((s) => s.setSelectedRestaurant);
  const followIds = useApp((s) => s.followIds);
  const isFollowing = followIds.includes(post.restaurant.id);
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.likes);

  const handleLike = async () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    try { await likeMut.mutateAsync(post.id); } catch {}
  };

  const handleFollow = async () => {
    followMut.mutate(post.restaurant.id);
    toast.success(isFollowing ? "Dejaste de seguir" : `Siguiendo a ${post.restaurant.name} ✓`);
  };

  const handleOrder = () => {
    if (post.menuItemId) {
      addToCart({
        menuItemId: post.menuItemId, name: post.caption.split("\n")[0], emoji: "🍽️",
        price: 0, qty: 1, restaurantId: post.restaurant.id, restaurantName: post.restaurant.name,
      });
      toast.success("¡Plato añadido al carrito! 🛒");
    }
    setSelectedRestaurant(post.restaurant.id);
  };

  return (
    <Card className="overflow-hidden p-0 shadow-soft">
      {/* Header */}
      <div className="flex items-center gap-2 p-3">
        <button onClick={() => setSelectedRestaurant(post.restaurant.id)}>
          <img src={post.restaurant.imageUrl} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-border/40" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-bold">{post.restaurant.name}</p>
          <p className="text-[11px] text-muted-foreground">{post.restaurant.cuisine}</p>
        </div>
        {post.isSponsored && (
          <span className="rounded-full bg-mango/15 px-2 py-0.5 text-[10px] font-bold" style={{ color: "var(--mango)" }}>Patrocinado</span>
        )}
        <button onClick={handleFollow} className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition", isFollowing ? "bg-secondary text-muted-foreground" : "text-white")} style={!isFollowing ? { background: "var(--antojo)" } : undefined}>
          {isFollowing ? <UserCheck size={12} /> : <UserPlus size={12} />}
          {isFollowing ? "Siguiendo" : "Seguir"}
        </button>
      </div>
      {/* Image */}
      <div className="relative aspect-square bg-secondary" onClick={() => {}}>
        <img src={post.imageUrl} alt={post.caption} className="h-full w-full object-cover" />
      </div>
      {/* Actions */}
      <div className="p-3">
        <div className="flex items-center gap-3">
          <button onClick={handleLike} className="flex items-center gap-1 text-sm transition hover:scale-110">
            <Heart size={20} className={cn("transition", liked && "fill-current")} style={{ color: liked ? "var(--antojo)" : "currentColor" }} />
            <span className="font-semibold tabular-nums">{likeCount}</span>
          </button>
          <span className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</span>
        </div>
        {/* Caption */}
        <p className="mt-2 text-sm leading-relaxed">{post.caption}</p>
        {/* CTA */}
        {post.menuItemId && (
          <Button className="mt-3 w-full rounded-xl gap-2 shadow-soft" style={{ background: "var(--antojo)", color: "white" }} onClick={handleOrder}>
            <ShoppingBag size={16} /> Ordenar este plato
          </Button>
        )}
      </div>
    </Card>
  );
}

// ---------- Stories Bar ----------
function StoriesBar({ groups }: { groups: any[] }) {
  const [viewing, setViewing] = useState<{ groupIdx: number; storyIdx: number } | null>(null);
  const markViewed = useMarkStoryViewed();

  const openStory = (groupIdx: number) => {
    setViewing({ groupIdx, storyIdx: 0 });
    const story = groups[groupIdx].stories[0];
    if (story && !story.viewed) markViewed.mutate(story.id);
  };

  return (
    <>
      <div className="no-scrollbar -mx-3 mb-4 flex gap-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0">
        {groups.map((group, gi) => {
          const hasUnviewed = group.stories.some((s: any) => !s.viewed);
          return (
            <button key={group.restaurant.id} onClick={() => openStory(gi)} className="flex w-16 shrink-0 flex-col items-center gap-1">
              <div className={cn("rounded-full p-0.5", hasUnviewed ? "bg-antojo-gradient" : "bg-secondary")}>
                <div className="rounded-full bg-background p-0.5">
                  <img src={group.restaurant.imageUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
                </div>
              </div>
              <span className="w-full truncate text-center text-[10px] font-semibold">{group.restaurant.name.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>
      {viewing && <StoryViewer groups={groups} viewing={viewing} setViewing={setViewing} />}
    </>
  );
}

function StoryViewer({ groups, viewing, setViewing }: { groups: any[]; viewing: { groupIdx: number; storyIdx: number }; setViewing: (v: any) => void }) {
  const markViewed = useMarkStoryViewed();
  const setSelectedRestaurant = useApp((s) => s.setSelectedRestaurant);
  const group = groups[viewing.groupIdx];
  const story = group?.stories[viewing.storyIdx];

  if (!story) { setViewing(null); return null; }

  const next = () => {
    if (viewing.storyIdx < group.stories.length - 1) {
      const ni = viewing.storyIdx + 1;
      setViewing({ groupIdx: viewing.groupIdx, storyIdx: ni });
      if (!group.stories[ni].viewed) markViewed.mutate(group.stories[ni].id);
    } else if (viewing.groupIdx < groups.length - 1) {
      setViewing({ groupIdx: viewing.groupIdx + 1, storyIdx: 0 });
    } else {
      setViewing(null);
    }
  };
  const prev = () => {
    if (viewing.storyIdx > 0) setViewing({ groupIdx: viewing.groupIdx, storyIdx: viewing.storyIdx - 1 });
    else if (viewing.groupIdx > 0) setViewing({ groupIdx: viewing.groupIdx - 1, storyIdx: groups[viewing.groupIdx - 1].stories.length - 1 });
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90" onClick={next}>
        <button onClick={(e) => { e.stopPropagation(); setViewing(null); }} className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white"><X size={20} /></button>
        <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-2 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white"><ChevronRight size={20} className="rotate-180" /></button>
        {/* Progress bars */}
        <div className="absolute left-4 right-4 top-4 flex gap-1">
          {group.stories.map((_: any, i: number) => (
            <div key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
              <div className="h-full rounded-full bg-white" style={{ width: i < viewing.storyIdx ? "100%" : i === viewing.storyIdx ? "100%" : "0%" }} />
            </div>
          ))}
        </div>
        <div className="relative max-h-[85vh] max-w-md" onClick={(e) => e.stopPropagation()}>
          <img src={story.imageUrl} alt="" className="max-h-[75vh] rounded-2xl object-contain" />
          <div className="absolute bottom-0 left-0 right-0 rounded-b-2xl bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="mb-2 flex items-center gap-2">
              <img src={group.restaurant.imageUrl} alt="" className="h-7 w-7 rounded-full" />
              <span className="text-sm font-bold text-white">{group.restaurant.name}</span>
            </div>
            {story.caption && <p className="mb-3 text-sm text-white/90">{story.caption}</p>}
            {story.menuItemId && (
              <Button className="w-full rounded-xl gap-2" style={{ background: "var(--antojo)", color: "white" }} onClick={() => { setSelectedRestaurant(group.restaurant.id); setViewing(null); }}>
                <Flame size={16} /> Ordenar ahora
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
