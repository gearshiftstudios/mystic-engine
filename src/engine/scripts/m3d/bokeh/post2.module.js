const fragment = `
varying vec2 vUv;
			uniform sampler2D tColor;
			uniform float textureWidth;
			uniform float textureHeight;

			float getWeight(float dist, float maxDist){
				return 1.0 - dist/maxDist;
			}
			
			void main() {
				vec3 blurColor = vec3(0.0);
				float coc = 0.0;
				const int cocBlurSize = 8;
				float cocBlurSizef = float(cocBlurSize);
				const int bokehBlurSize = 8;
				float bokehBlurSizef = float(bokehBlurSize);
				vec2 textureRatio = vec2(1.0/textureWidth, 1.0/textureHeight);
				vec3 sourceColor = texture2D(tColor, vUv).rgb;

				// blur the coc
				float cocBlurWeightTotal = 0.0;
				for(int i=-cocBlurSize; i<cocBlurSize; i++)
                        for(int j=-cocBlurSize; j<cocBlurSize; j++)
                        {
							vec2 dir =  vec2(i, j) * textureRatio;
							float dist = length(dir);
							if(dist > cocBlurSizef)
								continue;
							float weight = 1.0; // getWeight(dist, cocBlurSizef);
							cocBlurWeightTotal += weight;
							vec2 curUv = dir + vUv;
							coc += weight * texture2D(tColor, curUv).a;
						}
				coc /= cocBlurWeightTotal;
				float originalCoc = texture2D(tColor, vUv).a;

				// according to https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch28.html
				coc = 2.0 * max(originalCoc, coc) - originalCoc;
				
				
				float bokehBlurWeightTotal = 0.0;
				if (coc > 1e-5)
				{
					for(int i=-bokehBlurSize; i<bokehBlurSize; i++)
						for(int j=-bokehBlurSize; j<bokehBlurSize; j++)
						{
							vec2 dir = vec2(i, j) * textureRatio;  // can optimize
							float dist = length(dir);
							if(dist > bokehBlurSizef)
								continue;
							vec2 curUv = dir + vUv;
							float weight = getWeight(dist, bokehBlurSizef); 
							bokehBlurWeightTotal += weight;
							blurColor +=  weight * texture2D(tColor, curUv).rgb;
						}
					blurColor /= bokehBlurWeightTotal;
					
					gl_FragColor.rgb = mix(sourceColor, blurColor, coc);
				}
				else
				{
					gl_FragColor.rgb = sourceColor;
				}
				gl_FragColor.a = 1.0;
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