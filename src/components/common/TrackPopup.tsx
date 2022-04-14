import React from "react";
import { css } from "@emotion/css";
import { FaEllipsisV, FaPlus } from "react-icons/fa";
import IconButton from "./IconButton";
import Modal from "./Modal";
import ListButton from "./ListButton";
import { AddToPlaylist } from "../AddToPlaylist";
import { addTrackToUserFavorites, fetchTrackGroup } from "../../services/Api";
import { mapFavoriteAndPlaysToTracks } from "../../utils/tracks";
import { SpinningStar } from "./FavoriteTrack";

const TrackPopup: React.FC<{
  trackId?: number;
  groupId?: string;
  compact?: boolean;
}> = ({ trackId, groupId, compact }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = React.useState(false);
  const [selectedTrackIds, setSelectedTrackIds] = React.useState<number[]>([]);
  const [isPlaylistPickerOpen, setIsPlaylistPickerOpen] = React.useState(false);

  const openMenu = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.stopPropagation();
      setIsMenuOpen(true);
    },
    []
  );

  const openAddToPlaylist = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.stopPropagation();
      setIsMenuOpen(false);
      setIsPlaylistPickerOpen(true);
    },
    []
  );

  const onSongAdded = React.useCallback(() => {
    setIsMenuOpen(false);
    setIsPlaylistPickerOpen(false);
  }, []);

  const determineTracks = React.useCallback(
    async (trackId?: number, groupId?: string) => {
      let trackIds = [];
      if (trackId) {
        trackIds.push(trackId);
      } else if (groupId) {
        const result = await fetchTrackGroup(groupId);
        trackIds.push(...result.items.map((item) => item.track.id));
      } else {
        throw new Error(
          "TrackPopup needs to include either trackId or groupId"
        );
      }

      const mapped = await mapFavoriteAndPlaysToTracks(
        trackIds.map((id) => ({ id } as Track))
      );
      setIsFavorite(mapped[0]?.favorite ?? 0);
      setSelectedTrackIds(trackIds);
    },
    []
  );

  const onClickFavorite = React.useCallback(
    async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.stopPropagation();
      setIsLoadingFavorite(true);
      await Promise.all(
        selectedTrackIds.map((id) => addTrackToUserFavorites(id))
      );
      setIsFavorite((val) => !val);
      setIsLoadingFavorite(false);
    },
    [selectedTrackIds]
  );

  React.useEffect(() => {
    if (isMenuOpen) {
      determineTracks(trackId, groupId);
    }
  }, [trackId, groupId, determineTracks, isMenuOpen]);

  return (
    <>
      <div
        className={css`
          display: flex;
          align-items: center;
        `}
      >
        <IconButton onClick={(e) => openMenu(e)} compact={compact}>
          <FaEllipsisV />
        </IconButton>
      </div>

      {selectedTrackIds.length > 0 && (
        <Modal
          open={isPlaylistPickerOpen}
          onClose={() => setIsPlaylistPickerOpen(false)}
          size="small"
        >
          <AddToPlaylist
            selectedTrackIds={selectedTrackIds}
            onSongAdded={onSongAdded}
          />
        </Modal>
      )}

      {isMenuOpen && (
        <Modal
          open={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          size="small"
        >
          <ul
            className={css`
              list-style: none;
            `}
          >
            <li>
              <ListButton onClick={openAddToPlaylist}>
                <FaPlus /> Add to playlist
              </ListButton>
            </li>
            <li>
              <ListButton onClick={onClickFavorite}>
                <SpinningStar spinning={isLoadingFavorite} full={isFavorite} />{" "}
                {isFavorite ? "Remove from favorites" : "Add to favorites"}
              </ListButton>
            </li>
          </ul>
        </Modal>
      )}
    </>
  );
};

export default TrackPopup;
