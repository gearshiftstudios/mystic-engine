const fragment = `
#include <packing>

varying vec2 vUv;
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform float cameraNear;
uniform float cameraFar;
uniform float focalDepth;
uniform float farStart;
uniform float farRange;
uniform float nearStart;
uniform float nearRange;
uniform float textureWidth;
uniform float textureHeight;

const int circleSize = 8;
                
float readDepth( sampler2D depthSampler, vec2 coord ) {
    float fragCoordZ = texture2D( depthSampler, coord ).x;
    float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );

    return viewZ;
}
				
float getWeight(float dist, float maxDist){
	return 1.0 - dist/maxDist;
}

vec3 getColorBlur(vec2 uv){
    vec2 curUv;
    vec3 color = vec3(0.0, 0.0, 0.0);
    vec2 textureRatio = vec2(1.0/textureWidth, 1.0/textureHeight);
    float weightTotal = 0.0;
    float circleSizef = float(circleSize);
    
    for(int i=-circleSize; i<circleSize; i++)
        for(int j=-circleSize; j<circleSize; j++)
        {
			vec2 dir =  vec2(i, j) * textureRatio;
			float dist = length(dir);

            if(dist > float(circleSize))
                continue;

            curUv = uv + dir;
            float depth = readDepth(tDepth, curUv);
							
			// background should not mix foregournd in this pass
            if((-depth - focalDepth - farStart < 0.0))
                continue;
							
			float weight = getWeight(dist, circleSizef);
            color += weight * texture2D( tColor, curUv ).rgb;
            weightTotal += getWeight(dist, circleSizef);
        }

    return color * (1.0 / weightTotal);
}
                
void main() {
    vec3 color = texture2D( tColor, vUv ).rgb;
    float depth = readDepth( tDepth, vUv );
                
    float depthVal =  -depth - focalDepth;
    float coc = 0.0;
                
    if(depthVal < 0.0)
    {
        coc = (-depthVal - nearStart) / nearRange;
    }
    else
    {
        coc = (depthVal - farStart) / farRange;
    }
                
    coc = clamp(coc, 0.0, 1.0);
	bool isForeGroundOrFocus = -depth - (focalDepth + farStart) < 0.0; 

    // this shader only handle background.
	//  "a" channel stores the coc value.
	if(isForeGroundOrFocus) 
	{
		gl_FragColor.rgb = color;
		gl_FragColor.a = coc;
	}
	else
	{
		vec3 colorBlur = getColorBlur(vUv);                
		vec3 colorMix = mix(color, colorBlur, coc);
		gl_FragColor.rgb = vec3(colorMix);
	}				
}
`

const vertex = `
varying vec2 vUv;

void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export { fragment, vertex }