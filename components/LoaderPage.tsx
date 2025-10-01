import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const LoaderPage = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 28); // Roughly 3 seconds to reach 100

    return () => clearInterval(interval);
  }, []);

  return (
    <StyledWrapper>
      <div className="gearbox">
        <div className="overlay" />
        <div className="gear one">
          <div className="gear-inner">
            <div className="bar" />
            <div className="bar" />
            <div className="bar" />
          </div>
        </div>
        <div className="gear two">
          <div className="gear-inner">
            <div className="bar" />
            <div className="bar" />
            <div className="bar" />
          </div>
        </div>
        <div className="gear three">
          <div className="gear-inner">
            <div className="bar" />
            <div className="bar" />
            <div className="bar" />
          </div>
        </div>
        <div className="gear four large">
          <div className="gear-inner">
            <div className="bar" />
            <div className="bar" />
            <div className="bar" />
            <div className="bar" />
            <div className="bar" />
            <div className="bar" />
          </div>
        </div>
      </div>
      <div className="loading-text">
        Loading... {progress}%
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #000;

  .loading-text {
    margin-top: 2rem;
    color: #63bb33;
    font-size: 1.25rem;
    font-family: 'Courier New', Courier, monospace;
    text-shadow: 0 0 5px #63bb33, 0 0 10px #63bb33;
  }

  @keyframes clockwise {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes counter-clockwise {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(-360deg);
    }
  }

  .gearbox {
    background: #111;
    height: 150px;
    width: 200px;
    position: relative;
    border: none;
    overflow: hidden;
    border-radius: 6px;
    box-shadow: 0px 0px 1px 1px rgba(99, 187, 51, 0.2), 0 0 15px rgba(99, 187, 51, 0.4), inset 0 0 10px rgba(99, 187, 51, 0.2);
  }

  .gearbox .overlay {
    border-radius: 6px;
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
    box-shadow: inset 0px 0px 20px black;
    transition: background 0.2s;
  }

  .gearbox .overlay {
    background: transparent;
  }

  .gear {
    position: absolute;
    height: 60px;
    width: 60px;
    box-shadow: 0px -1px 0px 0px #888888, 0px 1px 0px 0px black;
    border-radius: 30px;
  }

  .gear.large {
    height: 120px;
    width: 120px;
    border-radius: 60px;
  }

  .gear.large:after {
    height: 96px;
    width: 96px;
    border-radius: 48px;
    margin-left: -48px;
    margin-top: -48px;
  }

  .gear.one {
    top: 12px;
    left: 10px;
  }

  .gear.two {
    top: 61px;
    left: 60px;
  }

  .gear.three {
    top: 110px;
    left: 10px;
  }

  .gear.four {
    top: 13px;
    left: 128px;
  }

  .gear:after {
    content: "";
    position: absolute;
    height: 36px;
    width: 36px;
    border-radius: 36px;
    background: #111;
    top: 50%;
    left: 50%;
    margin-left: -18px;
    margin-top: -18px;
    z-index: 3;
    box-shadow: 0px 0px 10px rgba(255, 255, 255, 0.1), inset 0px 0px 10px rgba(0, 0, 0, 0.1), inset 0px 2px 0px 0px #090909, inset 0px -1px 0px 0px #888888;
  }

  .gear-inner {
    position: relative;
    height: 100%;
    width: 100%;
    background: #555;
    border-radius: 30px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .large .gear-inner {
    border-radius: 60px;
  }

  .gear.one .gear-inner {
    animation: counter-clockwise 3s infinite linear;
  }

  .gear.two .gear-inner {
    animation: clockwise 3s infinite linear;
  }

  .gear.three .gear-inner {
    animation: counter-clockwise 3s infinite linear;
  }

  .gear.four .gear-inner {
    animation: counter-clockwise 6s infinite linear;
  }

  .gear-inner .bar {
    background: #555;
    height: 16px;
    width: 76px;
    position: absolute;
    left: 50%;
    margin-left: -38px;
    top: 50%;
    margin-top: -8px;
    border-radius: 2px;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
  }

  .large .gear-inner .bar {
    margin-left: -68px;
    width: 136px;
  }

  .gear-inner .bar:nth-child(2) {
    transform: rotate(60deg);
  }

  .gear-inner .bar:nth-child(3) {
    transform: rotate(120deg);
  }

  .gear-inner .bar:nth-child(4) {
    transform: rotate(90deg);
  }

  .gear-inner .bar:nth-child(5) {
    transform: rotate(30deg);
  }

  .gear-inner .bar:nth-child(6) {
    transform: rotate(150deg);
  }
`;

export default LoaderPage;