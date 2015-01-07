//
//  AudioScope.cpp
//  interface/src/audio
//
//  Created by Stephen Birarda on 2014-12-16.
//  Copyright 2014 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

#include <gpu/GPUConfig.h>

#include <limits>

#include <AudioConstants.h>

#include "Audio.h"

#include "AudioScope.h"

static const unsigned int DEFAULT_FRAMES_PER_SCOPE = 5;
static const unsigned int SCOPE_WIDTH = AudioConstants::NETWORK_FRAME_SAMPLES_PER_CHANNEL * DEFAULT_FRAMES_PER_SCOPE;
static const unsigned int MULTIPLIER_SCOPE_HEIGHT = 20;
static const unsigned int SCOPE_HEIGHT = 2 * 15 * MULTIPLIER_SCOPE_HEIGHT;

AudioScope::AudioScope() :
    _isEnabled(false),
    _isPaused(false),
    _scopeInputOffset(0),
    _scopeOutputOffset(0),
    _framesPerScope(DEFAULT_FRAMES_PER_SCOPE),
    _samplesPerScope(AudioConstants::NETWORK_FRAME_SAMPLES_PER_CHANNEL * _framesPerScope),
    _scopeInput(NULL),
    _scopeOutputLeft(NULL),
    _scopeOutputRight(NULL),
    _scopeLastFrame()
{
    Audio::SharedPointer audioIO = DependencyManager::get<Audio>();
    connect(&audioIO->getReceivedAudioStream(), &MixedProcessedAudioStream::addedSilence,
            this, &AudioScope::addStereoSilenceToScope);
    connect(&audioIO->getReceivedAudioStream(), &MixedProcessedAudioStream::addedLastFrameRepeatedWithFade,
            this, &AudioScope::addLastFrameRepeatedWithFadeToScope);
    connect(&audioIO->getReceivedAudioStream(), &MixedProcessedAudioStream::addedStereoSamples,
            this, &AudioScope::addStereoSamplesToScope);
    connect(audioIO.data(), &Audio::inputReceived, this, &AudioScope::addInputToScope);
}

void AudioScope::toggle() {
    _isEnabled = !_isEnabled;
    if (_isEnabled) {
        allocateScope();
    } else {
        freeScope();
    }
}

void AudioScope::selectAudioScopeFiveFrames() {
    reallocateScope(5);
}

void AudioScope::selectAudioScopeTwentyFrames() {
    reallocateScope(20);
}

void AudioScope::selectAudioScopeFiftyFrames() {
    reallocateScope(50);
}

void AudioScope::allocateScope() {
    _scopeInputOffset = 0;
    _scopeOutputOffset = 0;
    int num = _samplesPerScope * sizeof(int16_t);
    _scopeInput = new QByteArray(num, 0);
    _scopeOutputLeft = new QByteArray(num, 0);
    _scopeOutputRight = new QByteArray(num, 0);
}

void AudioScope::reallocateScope(int frames) {
    if (_framesPerScope != frames) {
        _framesPerScope = frames;
        _samplesPerScope = AudioConstants::NETWORK_FRAME_SAMPLES_PER_CHANNEL * _framesPerScope;
        freeScope();
        allocateScope();
    }
}

void AudioScope::freeScope() {
    if (_scopeInput) {
        delete _scopeInput;
        _scopeInput = 0;
    }
    if (_scopeOutputLeft) {
        delete _scopeOutputLeft;
        _scopeOutputLeft = 0;
    }
    if (_scopeOutputRight) {
        delete _scopeOutputRight;
        _scopeOutputRight = 0;
    }
}

void AudioScope::render(int width, int height) {
    
    if (!_isEnabled) {
        return;
    }
    
    static const float backgroundColor[4] = { 0.4f, 0.4f, 0.4f, 0.6f };
    static const float gridColor[4] = { 0.7f, 0.7f, 0.7f, 1.0f };
    static const float inputColor[4] = { 0.3f, 1.0f, 0.3f, 1.0f };
    static const float outputLeftColor[4] = { 1.0f, 0.3f, 0.3f, 1.0f };
    static const float outputRightColor[4] = { 0.3f, 0.3f, 1.0f, 1.0f };
    static const int gridRows = 2;
    int gridCols = _framesPerScope;
    
    int x = (width - (int)SCOPE_WIDTH) / 2;
    int y = (height - (int)SCOPE_HEIGHT) / 2;
    int w = (int)SCOPE_WIDTH;
    int h = (int)SCOPE_HEIGHT;
    
    renderBackground(backgroundColor, x, y, w, h);
    renderGrid(gridColor, x, y, w, h, gridRows, gridCols);
    
    renderLineStrip(inputColor, x, y, _samplesPerScope, _scopeInputOffset, _scopeInput);
    renderLineStrip(outputLeftColor, x, y, _samplesPerScope, _scopeOutputOffset, _scopeOutputLeft);
    renderLineStrip(outputRightColor, x, y, _samplesPerScope, _scopeOutputOffset, _scopeOutputRight);
}

void AudioScope::renderBackground(const float* color, int x, int y, int width, int height) {
    glColor4fv(color);
    glBegin(GL_QUADS);
    
    glVertex2i(x, y);
    glVertex2i(x + width, y);
    glVertex2i(x + width, y + height);
    glVertex2i(x , y + height);
    
    glEnd();
    glColor4f(1, 1, 1, 1);
}

void AudioScope::renderGrid(const float* color, int x, int y, int width, int height, int rows, int cols) {
    
    glColor4fv(color);
    glBegin(GL_LINES);
    
    int dx = width / cols;
    int dy = height / rows;
    int tx = x;
    int ty = y;
    
    // Draw horizontal grid lines
    for (int i = rows + 1; --i >= 0; ) {
        glVertex2i(x, ty);
        glVertex2i(x + width, ty);
        ty += dy;
    }
    // Draw vertical grid lines
    for (int i = cols + 1; --i >= 0; ) {
        glVertex2i(tx, y);
        glVertex2i(tx, y + height);
        tx += dx;
    }
    glEnd();
    glColor4f(1, 1, 1, 1);
}

void AudioScope::renderLineStrip(const float* color, int x, int y, int n, int offset, const QByteArray* byteArray) {
    
    glColor4fv(color);
    glBegin(GL_LINE_STRIP);
    
    int16_t sample;
    int16_t* samples = ((int16_t*) byteArray->data()) + offset;
    int numSamplesToAverage = _framesPerScope / DEFAULT_FRAMES_PER_SCOPE;
    int count = (n - offset) / numSamplesToAverage;
    int remainder = (n - offset) % numSamplesToAverage;
    y += SCOPE_HEIGHT / 2;
    
    // Compute and draw the sample averages from the offset position
    for (int i = count; --i >= 0; ) {
        sample = 0;
        for (int j = numSamplesToAverage; --j >= 0; ) {
            sample += *samples++;
        }
        sample /= numSamplesToAverage;
        glVertex2i(x++, y - sample);
    }
    
    // Compute and draw the sample average across the wrap boundary
    if (remainder != 0) {
        sample = 0;
        for (int j = remainder; --j >= 0; ) {
            sample += *samples++;
        }
        
        samples = (int16_t*) byteArray->data();
        
        for (int j = numSamplesToAverage - remainder; --j >= 0; ) {
            sample += *samples++;
        }
        sample /= numSamplesToAverage;
        glVertex2i(x++, y - sample);
    } else {
        samples = (int16_t*) byteArray->data();
    }
    
    // Compute and draw the sample average from the beginning to the offset
    count = (offset - remainder) / numSamplesToAverage;
    for (int i = count; --i >= 0; ) {
        sample = 0;
        for (int j = numSamplesToAverage; --j >= 0; ) {
            sample += *samples++;
        }
        sample /= numSamplesToAverage;
        glVertex2i(x++, y - sample);
    }
    glEnd();
    glColor4f(1, 1, 1, 1); 
}

int AudioScope::addBufferToScope(QByteArray* byteArray, int frameOffset, const int16_t* source, int sourceSamplesPerChannel,
                            unsigned int sourceChannel, unsigned int sourceNumberOfChannels, float fade) {
    if (!_isEnabled || _isPaused) {
        return 0;
    }
    
    // Temporary variable receives sample value
    float sample;
    
    // Short int pointer to mapped samples in byte array
    int16_t* destination = (int16_t*) byteArray->data();
    
    for (int i = 0; i < sourceSamplesPerChannel; i++) {
        sample = (float)source[i * sourceNumberOfChannels + sourceChannel];
        destination[frameOffset] = sample / (float) AudioConstants::MAX_SAMPLE_VALUE * (float)SCOPE_HEIGHT / 2.0f;
        frameOffset = (frameOffset == _samplesPerScope - 1) ? 0 : frameOffset + 1;
    }
    return frameOffset;
}

int AudioScope::addSilenceToScope(QByteArray* byteArray, int frameOffset, int silentSamples) {
                                                                                                                                                                                                                                    
    // Short int pointer to mapped samples in byte array
    int16_t* destination = (int16_t*)byteArray->data();
    
    if (silentSamples >= _samplesPerScope) {
        memset(destination, 0, byteArray->size());
        return frameOffset;
    }
    
    int samplesToBufferEnd = _samplesPerScope - frameOffset;
    if (silentSamples > samplesToBufferEnd) {
        memset(destination + frameOffset, 0, samplesToBufferEnd * sizeof(int16_t));
        memset(destination, 0, silentSamples - samplesToBufferEnd * sizeof(int16_t));
    } else {
        memset(destination + frameOffset, 0, silentSamples * sizeof(int16_t));
    }
    
    return (frameOffset + silentSamples) % _samplesPerScope;
}


const int STEREO_FACTOR = 2;

void AudioScope::addStereoSilenceToScope(int silentSamplesPerChannel) {
    if (!_isEnabled || _isPaused) {
        return;
    }
    addSilenceToScope(_scopeOutputLeft, _scopeOutputOffset, silentSamplesPerChannel);
    _scopeOutputOffset = addSilenceToScope(_scopeOutputRight, _scopeOutputOffset, silentSamplesPerChannel);
}

void AudioScope::addStereoSamplesToScope(const QByteArray& samples) {
    if (!_isEnabled || _isPaused) {
        return;
    }
    const int16_t* samplesData = reinterpret_cast<const int16_t*>(samples.data());
    int samplesPerChannel = samples.size() / sizeof(int16_t) / STEREO_FACTOR;
    
    addBufferToScope(_scopeOutputLeft, _scopeOutputOffset, samplesData, samplesPerChannel, 0, STEREO_FACTOR);
    _scopeOutputOffset = addBufferToScope(_scopeOutputRight, _scopeOutputOffset, samplesData, samplesPerChannel, 1, STEREO_FACTOR);
    
    _scopeLastFrame = samples.right(AudioConstants::NETWORK_FRAME_BYTES_STEREO);
}

void AudioScope::addLastFrameRepeatedWithFadeToScope(int samplesPerChannel) {
    const int16_t* lastFrameData = reinterpret_cast<const int16_t*>(_scopeLastFrame.data());
    
    int samplesRemaining = samplesPerChannel;
    int indexOfRepeat = 0;
    do {
        int samplesToWriteThisIteration = std::min(samplesRemaining, (int) AudioConstants::NETWORK_FRAME_SAMPLES_PER_CHANNEL);
        float fade = calculateRepeatedFrameFadeFactor(indexOfRepeat);
        addBufferToScope(_scopeOutputLeft, _scopeOutputOffset, lastFrameData,
                         samplesToWriteThisIteration, 0, STEREO_FACTOR, fade);
        _scopeOutputOffset = addBufferToScope(_scopeOutputRight, _scopeOutputOffset,
                                              lastFrameData, samplesToWriteThisIteration, 1, STEREO_FACTOR, fade);
        
        samplesRemaining -= samplesToWriteThisIteration;
        indexOfRepeat++;
    } while (samplesRemaining > 0);
}

void AudioScope::addInputToScope(const QByteArray& inputSamples) {
    if (!_isEnabled || _isPaused) {
        return;
    }
    
    const int INPUT_AUDIO_CHANNEL = 0;
    const int NUM_INPUT_CHANNELS = 1;
    
    _scopeInputOffset = addBufferToScope(_scopeInput, _scopeInputOffset,
                                         reinterpret_cast<const int16_t*>(inputSamples.data()),
                                         inputSamples.size() / sizeof(int16_t), INPUT_AUDIO_CHANNEL, NUM_INPUT_CHANNELS);
}
