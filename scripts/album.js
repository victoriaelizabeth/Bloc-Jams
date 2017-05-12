var setSong = function(songNumber) {
    if (currentSoundFile) {
        currentSoundFile.stop();
    }
    
    currentlyPlayingSongNumber = parseInt(songNumber);
    currentSongFromAlbum = currentAlbum.songs[songNumber - 1];
    
    currentSoundFile = new buzz.sound(currentSongFromAlbum.audioUrl, {
        formats: ['mp3'],
        preload: true
    });
    
    setVolume(currentVolume);
};

var seek = function(time) {
     if (currentSoundFile) {
         currentSoundFile.setTime(time);
     }
 }

var setVolume = function(volume) {
    if (currentSoundFile) {
        currentSoundFile.setVolume(volume);
    }
};

var getSongNumberCell = function(number) {
    return $('.song-item-number[data-song-number="' + number + '"]');
};

var createSongRow = function(songNumber, songName, songLength) {
     var template =
        '<tr class="album-view-song-item">'
      + '  <td class="song-item-number" data-song-number="' + songNumber + '">' + songNumber + '</td>'
      + '  <td class="song-item-title">' + songName + '</td>'
      + '  <td class="song-item-duration">' + filterTimeCode(songLength) + '</td>'
      + '</tr>'
      ;
 
     var $row = $(template);
    
     var clickHandler = function() {
        var songNumber = parseInt($(this).attr('data-song-number'));
          
        if (currentlyPlayingSongNumber !== null) {
            var currentlyPlayingSongElement = getSongNumberCell(currentlyPlayingSongNumber);
            currentlyPlayingSongElement.html(currentlyPlayingSongNumber);
        }
        if (currentlyPlayingSongNumber !== songNumber) {
            $(this).html(pauseButtonTemplate);
            setSong(songNumber);
            currentSoundFile.play();
            updateSeekBarWhileSongPlays();
            
            $('.volume .fill').width(currentVolume + '%');
            $('.volume .thumb').css({left: currentVolume + '%'});
            
            updatePlayerBarSong();
        } else if (currentlyPlayingSongNumber === songNumber) {
            if (currentSoundFile.isPaused()) {
                $(this).html(pauseButtonTemplate);
                $('.main-controls .play-pause').html(playerBarPauseButton); 
                currentSoundFile.play();
                updateSeekBarWhileSongPlays();
            } else {
                $(this).html(playButtonTemplate);
                $('.main-controls .play-pause').html(playerBarPlayButton); 
                currentSoundFile.pause();
            }
        } 
        
     }; 

     var onHover = function(event) {
         var songItem = $(this).find('.song-item-number');
         var songItemNumber = parseInt(songItem.attr('data-song-number'));
         if (songItemNumber !== currentlyPlayingSongNumber) {
             songItem.html(playButtonTemplate);
         }
     };
     var offHover = function(event) {
         var songItem = $(this).find('.song-item-number');
         var songItemNumber = parseInt(songItem.attr('data-song-number'));
         if (songItemNumber !== currentlyPlayingSongNumber) {
             songItem.html(songItemNumber);
         }
  
     };
    
     $row.find('.song-item-number').click(clickHandler);
    
     $row.hover(onHover, offHover);
    

     return $row;
 };

 var setCurrentAlbum = function(album) {
     currentAlbum = album;

     var $albumTitle = $('.album-view-title');
     var $albumArtist = $('.album-view-artist');
     var $albumReleaseInfo = $('.album-view-release-info');
     var $albumImage = $('.album-cover-art');
     var $albumSongList = $('.album-view-song-list');
 

     $albumTitle.text(album.title);
     $albumArtist.text(album.artist);
     $albumReleaseInfo.text(album.year + ' ' + album.label);
    
     $albumImage.attr('src', album.albumArtUrl);
 
    
     $albumSongList.empty();
 
     for (var i = 0; i < album.songs.length; i++) {
         var $newRow = createSongRow(i+1, album.songs[i].title, album.songs[i].duration);
         $albumSongList.append($newRow);
     }
 };

 var updateSeekBarWhileSongPlays = function() {
     if (currentSoundFile) {
  
         currentSoundFile.bind('timeupdate', function(event) {
          
             var seekBarFillRatio = this.getTime() / this.getDuration();
             var $seekBar = $('.seek-control .seek-bar');
 
             updateSeekPercentage($seekBar, seekBarFillRatio);
             setCurrentTimeInPlayer(this.getTime());
         });
     }
 };

 var updateSeekPercentage = function($seekBar, seekBarFillRatio) {
    var offsetXPercent = seekBarFillRatio * 100;

    offsetXPercent = Math.max(0, offsetXPercent);
    offsetXPercent = Math.min(100, offsetXPercent);

    var percentageString = offsetXPercent + '%';
    $seekBar.find('.fill').width(percentageString);
    $seekBar.find('.thumb').css({left: percentageString});
 };

var setupSeekBars = function() {
     var $seekBars = $('.player-bar .seek-bar');
 
     $seekBars.click(function(event) {

         var offsetX = event.pageX - $(this).offset().left;
         var barWidth = $(this).width();
         var seekBarFillRatio = offsetX / barWidth;
         
         if ($(this).parent().hasClass("seek-control")) {
            seek(seekBarFillRatio * currentSoundFile.getDuration());
         } else {
            setVolume(seekBarFillRatio * 100);   
         }

         updateSeekPercentage($(this), seekBarFillRatio);
     });
    
    $seekBars.find('.thumb').mousedown(function(event) {
 
         var $seekBar = $(this).parent();

         $(document).bind('mousemove.thumb', function(event){
             var offsetX = event.pageX - $seekBar.offset().left;
             var barWidth = $seekBar.width();
             var seekBarFillRatio = offsetX / barWidth;
             
             if ($seekBar.parent().hasClass("seek-control")) {
                seek(seekBarFillRatio * currentSoundFile.getDuration());   
             } else {
                setVolume(seekBarFillRatio);
             }
 
             updateSeekPercentage($seekBar, seekBarFillRatio);
         });

         $(document).bind('mouseup.thumb', function() {
             $(document).unbind('mousemove.thumb');
             $(document).unbind('mouseup.thumb');
         });
     });
 };

var trackIndex = function(album, song) {
    return album.songs.indexOf(song);
};

var updatePlayerBarSong = function() {
    $('.currently-playing .song-name').text(currentSongFromAlbum.title);
    $('.currently-playing .artist-name').text(currentAlbum.artist);
    $('.currently-playing .artist-song-mobile').text(currentSongFromAlbum.title + " - " + currentAlbum.artist);
    $('.main-controls .play-pause').html(playerBarPauseButton);
    setTotalTimeInPlayerBar(currentSongFromAlbum.duration);
};

var togglePlayFromPlayerBar = function() {
    var currentlyPlayingCell = getSongNumberCell(currentlyPlayingSongNumber);
    
    if(currentSoundFile.isPaused()) {
        $(currentlyPlayingCell).html(pauseButtonTemplate);
        
        $('.main-controls .play-pause').html(playerBarPauseButton);
        currentSoundFile.play();
        updateSeekBarWhileSongPlays();
    }
    
    else {
        $(currentlyPlayingCell).html(playButtonTemplate);
        $('.main-controls .play-pause').html(playerBarPlayButton);
        currentSoundFile.pause();
    }
};


var nextSong = function() {
    
    var getLastSongNumber = function(i) {
        if (i == 0) {
            return currentAlbum.songs.length;
        } else {
            return i;
        }
    };
    
    var index = trackIndex(currentAlbum, currentSongFromAlbum);
    index++;
    
    if (index >= currentAlbum.songs.length) {
        index = 0;
    }
    
    setSong(index + 1);
    
    currentSoundFile.play();
    updateSeekBarWhileSongPlays();
    
    updatePlayerBarSong();
    
    var lastSongNumber = getLastSongNumber(index);
    var $nextSongNumberCell = getSongNumberCell(currentlyPlayingSongNumber);
    var $lastSongNumberCell = getSongNumberCell(lastSongNumber);
    
    $nextSongNumberCell.html(pauseButtonTemplate);
    $lastSongNumberCell.html(lastSongNumber);
    
};

var previousSong = function() {
    
    var getLastSongNumber = function(i) {
        if (i == (currentAlbum.songs.length - 1)) {
            return 1;
        } else {
            return i + 2;
        }
    };
    
   
    var index = trackIndex(currentAlbum, currentSongFromAlbum);
    index--;
    
    if (index < 0) {
        index = currentAlbum.songs.length - 1;
    }

    setSong(index + 1);
    
    currentSoundFile.play();
    updateSeekBarWhileSongPlays();

    updatePlayerBarSong();
    
    var lastSongNumber = getLastSongNumber(index);
    var $previousSongNumberCell = getSongNumberCell(currentlyPlayingSongNumber);
    var $lastSongNumberCell = getSongNumberCell(lastSongNumber);
    
    $previousSongNumberCell.html(pauseButtonTemplate);
    $lastSongNumberCell.html(lastSongNumber);
    
};

var setCurrentTimeInPlayer = function(currentTime) {
    $('.current-time').text(filterTimeCode(currentTime));
};

var setTotalTimeInPlayerBar = function(totalTime) {
    $('.total-time').text(filterTimeCode(totalTime));
};

var filterTimeCode = function(seconds) {
    var minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    seconds = seconds < 10 ? "0" + seconds : seconds;
    return minutes + ":" + seconds;
};

var playButtonTemplate = '<a class="album-song-button"><span class="ion-play"></span></a>';
var pauseButtonTemplate = '<a class="album-song-button"><span class="ion-pause"></span></a>';
var playerBarPlayButton = '<span class="ion-play"></span>';
var playerBarPauseButton = '<span class="ion-pause"></span>';

var currentAlbum = null;
var currentlyPlayingSongNumber = null;
var currentSongFromAlbum = null;
var currentSoundFile = null;
var currentVolume = 80;

var $previousButton = $('.main-controls .previous');
var $nextButton = $('.main-controls .next');
var $playerBarPlayToggle = $('.main-controls .play-pause');

 $(document).ready(function() {
     setCurrentAlbum(albumPicasso);  
     setupSeekBars();
     $previousButton.click(previousSong);
     $nextButton.click(nextSong);
     $playerBarPlayToggle.click(togglePlayFromPlayerBar);
 });