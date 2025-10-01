import React from 'react';
import styled from 'styled-components';

const GearsBackground = () => {
  return (
    <StyledWrapper>
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
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  opacity: 0.1;
  overflow: hidden;

  @keyframes clockwise {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes counter-clockwise {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(-360deg); }
  }

  .gear {
    position: absolute;
    height: 60px;
    width: 60px;
    border-radius: 30px;
  }
  .gear.large {
    height: 120px;
    width: 120px;
    border-radius: 60px;
  }
  .gear.one { top: 12px; right: 10px; }
  .gear.two { top: 61px; right: 60px; }
  .gear.three { top: 110px; right: 10px; }
  .gear.four { top: 13px; right: 128px; }

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
  }
  .gear.large:after {
    height: 96px;
    width: 96px;
    border-radius: 48px;
    margin-left: -48px;
    margin-top: -48px;
  }
  
  .gear-inner {
    position: relative;
    height: 100%;
    width: 100%;
    background: #555;
    border-radius: 30px;
  }
  .large .gear-inner {
    border-radius: 60px;
  }
  
  .gear.one .gear-inner { animation: counter-clockwise 6s infinite linear; }
  .gear.two .gear-inner { animation: clockwise 6s infinite linear; }
  .gear.three .gear-inner { animation: counter-clockwise 6s infinite linear; }
  .gear.four .gear-inner { animation: counter-clockwise 10s infinite linear; }
  
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
  }
  .large .gear-inner .bar {
    margin-left: -68px;
    width: 136px;
  }
  .gear-inner .bar:nth-child(2) { transform: rotate(60deg); }
  .gear-inner .bar:nth-child(3) { transform: rotate(120deg); }
  .gear-inner .bar:nth-child(4) { transform: rotate(90deg); }
  .gear-inner .bar:nth-child(5) { transform: rotate(30deg); }
  .gear-inner .bar:nth-child(6) { transform: rotate(150deg); }
`;

export default GearsBackground;