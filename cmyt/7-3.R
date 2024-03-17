x=39
x
n=50
n
P=0.85
P
p=x/n
p
alpha=1/100
alpha
Test_5_percent=prop.test(x, n, p=P, alternative = "greater", conf.level =0.99) 
Test_5_percent 
Test_statistic_Z_value2=sqrt(Test_5_percent$statistic) 
Test_statistic_Z_value2 
P_value2=round(Test_5_percent$p.value,2) 
P_value2
Critical_Z_value2=round(qnorm(1-alpha),2) 
Critical_Z_value2
if(Test_statistic_Z_value2< Critical_Z_value2){"H0 is accepted"}else{"H0 is rejected"} 
if(P_value2< alpha2){"H0 is rejected"}else{" H0 is accepted"}
