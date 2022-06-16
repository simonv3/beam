import { useGlobalStateContext } from "contexts/globalState";
import { useSnackbar } from "contexts/SnackbarContext";
import React from "react";
import { FaPlus } from "react-icons/fa";
import { createTrackGroup, fetchUserTrackGroups } from "../services/Api";
import IconButton from "./common/IconButton";
import InlineForm from "./common/InlineForm";
import Input from "./common/Input";

export const AddPlaylist: React.FC<{ refresh: (id: string) => void }> = ({
  refresh,
}) => {
  const snackbar = useSnackbar();
  const { dispatch } = useGlobalStateContext();

  const [newPlaylistName, setNewPlaylistName] = React.useState<string>("");

  const onChange = React.useCallback((e) => {
    setNewPlaylistName(e.target.value ?? "");
  }, []);

  const onAddPlaylist = React.useCallback(
    async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.preventDefault();
      const trackgroup = await createTrackGroup({
        // FIXME: the POST trackgroup API endpoint requires a cover id,
        // which doesn't really make sense in this flow.
        cover: "ba6c693f-e2c8-44f8-8d1b-742c81a1c551",
        title: newPlaylistName,
        type: "playlist",
      });
      setNewPlaylistName("");

      snackbar("Successfully created a playlist", { type: "success" });
      if (refresh) {
        refresh(trackgroup.id);
      }

      const playlists = await fetchUserTrackGroups({ type: "playlist" });
      dispatch({ type: "setUserPlaylists", playlists });
    },
    [newPlaylistName, refresh, dispatch, snackbar]
  );

  return (
    <InlineForm>
      <Input
        name="newPlaylistName"
        placeholder="New playlist name"
        value={newPlaylistName}
        onChange={onChange}
      />
      <IconButton onClick={onAddPlaylist}>
        <FaPlus />
      </IconButton>
    </InlineForm>
  );
};

export default AddPlaylist;
