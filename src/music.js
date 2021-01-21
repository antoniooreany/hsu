/**
 * Module for dealing with music and sound
 */
export const Music = {

  /**
    * use this to play a sound/music
    * track_id must be in the form '#track_id'
    * track ids can be found in index.html
    * the "loop" parameter can be set to true if you want the sound to keep looping
    *
    * use the volume parameter to change the volume, from 0.001 to 1.0!
    *
    * if you want to add an audiofile, add it to assets/music and make a line
    * for it in index.html like the following:
    * <audio src="assets/music/yourfile.extension" id="yourID"></audio>
    * */
  playTrack(trackId, loop) {
    const song = document.querySelector(trackId);
    song.loop = !!loop;
    // plays the selected track
    return song.play();
  },
  /**
    * this function can be used to stop any sound or music track
    */
  stopTrack(trackId) {
    const song = document.querySelector(trackId);
    return song.pause();
  },

  /**
   * updateVolume.
   * Updates the global volume based on the 'rangeSlider' UI element
   * @returns {undefined}
   */
  updateVolume() {
    const newVolume = document.getElementById('rangeSlider').value;
    document.querySelectorAll('audio').forEach((element) => {
      element.volume = newVolume; // eslint-disable-line no-param-reassign
    });
    document.getElementById('range_value').innerText = `${parseInt((`${newVolume * 100}`), 10)}%`;
  },
};
