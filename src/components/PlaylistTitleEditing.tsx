import { css } from "@emotion/css";
import React from "react";
import { FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  deleteUserTrackGroup,
  updateTrackGroup,
  uploadTrackGroupCover,
} from "../services/Api";
import Button from "./common/Button";
import Input from "./common/Input";
import TextArea from "./common/TextArea";

const PlaylistTitleEditing: React.FC<{
  playlist: Release;
  onDone: (update?: boolean) => void;
}> = ({ playlist, onDone }) => {
  const navigate = useNavigate();
  const [playlistTitle, setPlaylistTitle] = React.useState(playlist.title);
  const [about, setAbout] = React.useState(playlist.about ?? "");
  const [isPrivate, setPrivate] = React.useState(playlist.private);

  const onChangeTitle = React.useCallback((e) => {
    setPlaylistTitle(e.target.value);
  }, []);

  const onChangeAbout = React.useCallback((e) => {
    setAbout(e.target.value);
  }, []);

  const onSave = React.useCallback(
    async (e) => {
      await updateTrackGroup(playlist.id, {
        cover: playlist.cover_metadata.id,
        tags: playlist.tags,
        type: "playlist",
        private: isPrivate,
        title: playlistTitle,
        about,
      });
      onDone(true);
    },
    [playlist, playlistTitle, onDone, isPrivate, about]
  );

  const replaceImage = React.useCallback(async (e) => {
    await uploadTrackGroupCover(e.target.files[0]);
  }, []);

  const onDelete = React.useCallback(async () => {
    await deleteUserTrackGroup(playlist.id);
    navigate("/library");
  }, [playlist.id, navigate]);

  const togglePrivate = () => {
    setPrivate((v) => !v);
  };

  return (
    <div
      className={css`
        display: flex;
        margin-bottom: 1rem;
      `}
    >
      <div
        className={css`
          position: relative;
        `}
      >
        <img src={playlist.cover} alt="Cover" width="300" />
        <label
          htmlFor="uploadCoverImage"
          className={css`
            position: absolute;
            left: 0;
            height: 100%;
            cursor: pointer;
            width: 100%;
            text-align: center;
            padding-top: 48%;
            transition: 0.25s;
            &:hover {
              background-color: rgba(0, 0, 0, 0.4);
              color: white;
            }
          `}
        >
          Replace
        </label>
        <input
          type="file"
          id="uploadCoverImage"
          accept="image/png, image/jpeg"
          onChange={replaceImage}
          className={css`
            display: none;
          `}
        />
      </div>
      <div
        className={css`
          padding-left: 1rem;
          display: flex;
          flex-grow: 1;
          flex-direction: column;
        `}
      >
        <div
          className={css`
            display: flex;
            align-items: center;
            margin-bottom: 1rem;

            > input:not([type="checkbox"]) {
              margin-bottom: 0;
              margin-right: 1rem;
            }

            > div {
              padding: 0.5rem 1rem;
              min-width: 140px;
              text-align: right;
            }
          `}
        >
          <Input value={playlistTitle} onChange={onChangeTitle} name="title" />
          <div>
            <label>is private? </label>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={togglePrivate}
            />
          </div>
        </div>
        <TextArea
          value={about}
          className={css`
            margin-bottom: 1rem;
          `}
          onChange={onChangeAbout}
        ></TextArea>
        <div
          className={css`
            display: flex;
            justify-content: flex-end;
          `}
        >
          <Button onClick={() => onDone()} variant="outlined">
            Cancel changes
          </Button>
          <Button onClick={onDelete} startIcon={<FaTrash />} variant="outlined">
            Delete
          </Button>

          <Button onClick={onSave}>Save</Button>
        </div>
      </div>
    </div>
  );
};

export default PlaylistTitleEditing;
