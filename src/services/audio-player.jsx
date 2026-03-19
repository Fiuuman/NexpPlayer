class AudioPlayerService {
  constructor() {
    this.audio = new Audio();
    this.currentTrack = null;
    this.playlist = [];
    this.currentIndex = 0;
    this.volume = 0.8;
    this.isPlaying = false;
    this.listeners = [];
    
    // Настройка аудио элемента
    this.audio.volume = this.volume;
    
    // События аудио
    this.audio.addEventListener('timeupdate', this.handleTimeUpdate.bind(this));
    this.audio.addEventListener('ended', this.handleTrackEnd.bind(this));
    this.audio.addEventListener('loadedmetadata', this.handleLoadedMetadata.bind(this));
  }
  
  // Добавить трек в плейлист
  addTrack(track) {
    this.playlist.push(track);
    this.notifyListeners();
  }
  
  // Загрузить трек
  loadTrack(track, index = 0) {
    this.currentTrack = track;
    this.currentIndex = index;
    this.audio.src = track.url;
    this.audio.load();
    this.notifyListeners();
  }
  
  // Воспроизвести/пауза
  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }
  
  play() {
    if (this.currentTrack) {
      this.audio.play();
      this.isPlaying = true;
      this.notifyListeners();
    }
  }
  
  pause() {
    this.audio.pause();
    this.isPlaying = false;
    this.notifyListeners();
  }
  
  // Следующий трек
  next() {
    if (this.playlist.length > 0) {
      const nextIndex = (this.currentIndex + 1) % this.playlist.length;
      this.loadTrack(this.playlist[nextIndex], nextIndex);
      this.play();
    }
  }
  
  // Предыдущий трек
  prev() {
    if (this.playlist.length > 0) {
      const prevIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
      this.loadTrack(this.playlist[prevIndex], prevIndex);
      this.play();
    }
  }
  
  // Установить время
  seek(time) {
    this.audio.currentTime = time;
  }
  
  // Установить громкость
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.audio.volume = this.volume;
    this.notifyListeners();
  }
  
  // Загрузить музыку
  uploadMusic(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const track = {
          id: Date.now(),
          title: file.name.replace(/\.[^/.]+$/, ""), // Убираем расширение
          artist: 'Неизвестный исполнитель',
          album: 'Загруженные треки',
          url: e.target.result,
          color: this.getRandomColor(),
          duration: 0 // Будет установлено после загрузки
        };
        
        this.addTrack(track);
        
        // Сохраняем в localStorage
        this.saveToLocalStorage(track);
        
        resolve(track);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  // Сохранить в localStorage
  saveToLocalStorage(track) {
    const savedTracks = JSON.parse(localStorage.getItem('harmony_tracks') || '[]');
    savedTracks.push(track);
    localStorage.setItem('harmony_tracks', JSON.stringify(savedTracks));
  }
  
  // Загрузить из localStorage
  loadFromLocalStorage() {
    const savedTracks = JSON.parse(localStorage.getItem('harmony_tracks') || '[]');
    this.playlist = savedTracks;
    this.notifyListeners();
    return savedTracks;
  }
  
  // Слушатели изменений
  addListener(listener) {
    this.listeners.push(listener);
  }
  
  removeListener(listener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }
  
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.getState()));
  }
  
  getState() {
    return {
      currentTrack: this.currentTrack,
      isPlaying: this.isPlaying,
      currentTime: this.audio.currentTime,
      duration: this.audio.duration || 0,
      volume: this.volume,
      playlist: this.playlist,
      currentIndex: this.currentIndex
    };
  }
  
  // Обработчики событий
  handleTimeUpdate() {
    this.notifyListeners();
  }
  
  handleTrackEnd() {
    this.next();
  }
  
  handleLoadedMetadata() {
    this.notifyListeners();
  }
  
  getRandomColor() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#ffd166', '#1db954', '#6c5ce7'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

// Создаем синглтон
export const audioPlayer = new AudioPlayerService();