import { useState, useRef, useEffect } from 'react';

export default () => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [prompt, setPrompt] = useState('a half-body portrait of a man img wearing the sunglasses in Iron man suit, best quality');
  const [negativePrompt, setNegativePrompt] = useState('(asymmetry, worst quality, low quality, illustration, 3d, 2d, painting, cartoons, sketch), open mouth, grayscale');
  const [generatedImages, setGeneratedImages] = useState([]);

  const [style, setStyle] = useState('(No style)'); // 스타일 상태 추가

  const [sampleSteps, setSampleSteps] = useState(50);
  const [styleStrength, setStyleStrength] = useState(20);
  const [brightness, setBrightness] = useState(50); // 밝기 상태 추가
  const [numberOfOutputImages, setNumberOfOutputImages] = useState(1);
  const [guidanceScale, setGuidanceScale] = useState(5);
  const [seed, setSeed] = useState(1);
  const [randomizeSeed, setRandomizeSeed] = useState(false);

  const [settings, setSettings] = useState([
    { name: 'sampleSteps', value: 50 },
    { name: 'styleStrength', value: 20 },
    { name: 'brightness', value: 50 },
    { name: 'numberOfOutputImages', value: 1 },
    { name: 'guidanceScale', value: 5 },
    { name: 'seed', value: 0 },
    { name: 'randomizeSeed', value: false },
  ]);

  const updateSetting = (name, newValue) => {
    setSettings(settings.map(setting =>
        setting.name === name ? { ...setting, value: newValue } : setting
      )
    );
  };

  const [queueStatus, setQueueStatus] = useState(0); // 대기열 상태 추가
  const [isLoading, setIsLoading] = useState(false);    // 로딩 상태 추가

  const [taskId, setTaskId] = useState(0); // taskId를 전역 상태로 설정


  const dropAreaRef = useRef(null);

  if (process.env.NODE_ENV === 'development') {
    console.log('Running in development mode');
    // 로컬 개발 환경에서 실행 중인 경우의 코드
  } else {
    console.log('Running in production mode');
    // 프로덕션 환경에서 실행 중인 경우의 코드
  }
  const url = (endpoint) => `${process.env.NODE_ENV == 'development' ? 'http://216.153.57.204:8080' : ''}/api/${endpoint}`;


  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = (e) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    updateFilesAndPreviews(droppedFiles);
  };

  const updateFilesAndPreviews = (newFiles) => {
    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    updatedFiles.forEach(file => previewFile(file));
  };

  const previewFile = (file) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setPreviews(prevPreviews => [...prevPreviews, reader.result]);
    };
  };
  const handleBrightnessChange = (value) => { //밑에 핸들슬라이더체인지는 일반화된 함수
    // 숫자 범위를 0-100 사이로 제한
    const newValue = Math.max(0, Math.min(100, value));
    setBrightness(newValue);
  };

  const handleSliderChange = (setter) => (e) => {
    setter(Number(e.target.value));
  };

  // ...

  const checkImageStatus = () => {
    console.log(`checkImageStatus: ${taskId}`)

    // 일정 간격으로 상태 확인
    fetch(url(`checkStatus/${taskId}`)) //여기서 taskId
      .then(response => response.json())
      .then(data => {
        console.log(+data.status);
        setQueueStatus(+data.status);  //큐 개수
        if (+data.status === 0 && taskId > 0) {
          // 이미지 생성 완료 처리
          const imageUrls = data.imagePaths.map(imagePath => url(`image/${imagePath.replaceAll('/', '+')}`));
          console.log(imageUrls);
          setGeneratedImages(imageUrls);
          setTaskId(0)
        }
        if (+data.status === 1) {
          setIsLoading(true);
        } else {
          setIsLoading(false);
        }
      })
      .catch(error => {
        console.error('Status check error:', error);
      })
  };
  useEffect(() => {
    checkImageStatus();
    const intervalId = setInterval(checkImageStatus, 1000); // 1초마다 대기열 상태를 확인

    return () => clearInterval(intervalId); // 컴포넌트 언마운트 시 인터벌 정리
  }, [taskId]);

  const onUpload = () => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('prompt', prompt);
    formData.append('negativePrompt', negativePrompt);
    formData.append('style', style);


    formData.append('sampleSteps', sampleSteps);
    formData.append('styleStrength', styleStrength);
    formData.append('numberOfOutputImages', numberOfOutputImages);
    formData.append('guidanceScale', guidanceScale);
    formData.append('seed', seed);
    // formData.append('seed', seed);

    // 서버 엔드포인트에 POST 요청 보내기
    fetch(url('generateImages/0'), {
      method: 'POST',
      body: formData,
    })
      .then(response => response.json())
      .then(data => {
        // 여기에서 data는 작업 ID 또는 작업 상태 확인을 위한 정보를 포함
        setTaskId(+data.taskId);
        // checkImageStatus(taskId); // 상태 확인 함수 호출
      })
      .catch(error => {
        console.error('Error:', error);
      });
  };

  return (
    <div>
      <h1>Photomaker-style</h1>
      <h2>이미지 업로드</h2>
      <div
        ref={dropAreaRef}
        onDragOver={onDragOver}
        onDrop={onDrop}
        style={{
          border: '2px dashed #ccc',
          borderRadius: '20px',
          width: '300px',
          minHeight: '200px',
          padding: '10px',
          textAlign: 'center',
          margin: '10px',
          position: 'relative',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {previews.map((preview, index) => (
          <img
            key={index}
            src={preview}
            alt="Preview"
            style={{
              width: '100px',
              height: '100px',
              objectFit: 'cover',
              margin: '5px',
              flex: '0 0 auto',
            }}
          />
        ))}
        {!previews.length && "여기에 파일을 드래그하세요"}
      </div>
      <h2>프롬프트</h2>
      <textarea type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} style={{width: "300px", height: "100px", resize: "none"}} placeholder="프롬프트 입력" />
      <h2>네거티브 프롬프트</h2>
      <textarea type="text" value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} style={{width: "300px", height: "100px", resize: "none"}} placeholder="네거티브 프롬프트 입력" />
      <button onClick={onUpload}>업로드</button>

      <h2>옵션</h2>
      <select value={style} onChange={(e) => setStyle(e.target.value)}>
        {["(No style)", "Cinematic", "Disney Character", "Digital Art", "Fantasy art", "Neonpunk", "Enhance", "Comic book", "Lowpoly", "Line art"].map((style, index) => (
          <option key={index} value={style}>{style}</option>
        ))}
      </select>

      <br></br>
      <label>
        Number of sample steps:
        <input
          type="range"
          min="1"
          max="100"
          value={sampleSteps}
          onChange={handleSliderChange(setSampleSteps)}
        />
        <input
          type="number"
          min="1"
          max="100"
          value={sampleSteps}
          onChange={handleSliderChange(setSampleSteps)}
        />
      </label>
      <br></br>

      <label>
        Style strength (%):
        <input
          type="range"
          min="0"
          max="100"
          value={styleStrength}
          onChange={handleSliderChange(setStyleStrength)}
        />
        <input
          type="number"
          min="0"
          max="100"
          value={styleStrength}
          onChange={handleSliderChange(setStyleStrength)}
        />
      </label>
      <br></br>

      <label>
        Number of output images:
        <input
          type="range"
          min="1"
          max="4"
          value={numberOfOutputImages}
          onChange={handleSliderChange(setNumberOfOutputImages)}
        />
        <input
          type="number"
          min="1"
          max="4"
          value={numberOfOutputImages}
          onChange={handleSliderChange(setNumberOfOutputImages)}
        />
      </label>
      <br></br>
      <label>
        Guidance scale:
        <input
          type="range"
          min="1"
          max="10"
          value={guidanceScale}
          onChange={handleSliderChange(setGuidanceScale)}
        />
        <input
          type="number"
          min="1"
          max="10"
          value={guidanceScale}
          onChange={handleSliderChange(setGuidanceScale)}
        />
      </label>
      <br></br>
      <label>
        Seed:
        <input
          type="range"
          min="0"
          max="2147483647"
          value={seed}
          onChange={handleSliderChange(setSeed)}
        />
        <input
          type="number"
          min="0"
          max="2147483647"
          value={seed}
          onChange={handleSliderChange(setSeed)}
        />
      </label>
      <br></br>
      {taskId > 0 && isLoading && <img src="https://media.giphy.com/media/uIJBFZoOaifHf52MER/giphy.gif" alt="Loading" />} {/* 로딩 GIF 표시 */}
      <br></br>

      {<p>대기열: {queueStatus}</p>} {/* 대기열 번호 표시 */}
      <br></br>


      {/* 생성된 이미지 표시 */}
      {console.log(generatedImages)}
      {generatedImages.length > 0 && (
        <div>
          <h2>생성된 이미지</h2>
          <div>
            {generatedImages.map((imageUrl, index) => (
              <img
                key={index}
                src={imageUrl}
                alt={`Generated Image ${index + 1}`}
                style={{
                  width: '200px',
                  height: '200px',
                  objectFit: 'cover',
                  margin: '10px',
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
